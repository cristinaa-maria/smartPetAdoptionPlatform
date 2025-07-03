package com.example.animal_adoption_platform.semanticSearch;

import com.example.animal_adoption_platform.model.Animal;
import com.example.animal_adoption_platform.model.User;
import com.example.animal_adoption_platform.repository.AnimalRepository;
import com.example.animal_adoption_platform.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SemanticSearchService {

    @Autowired
    private AnimalRepository animalRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private EmbeddingService embeddingService;
    @Autowired
    private RDFGraphService rdfGraphService;
    @Autowired
    private RDF2VecService rdf2VecService;

    private static final float BASE_TEXT_EMBEDDING_WEIGHT = 0.8f;
    private static final float BASE_RDF_EMBEDDING_WEIGHT = 0.2f;
    private static final Map<String, double[]> CITY_COORDINATES = Map.of(
            "bucuresti", new double[]{44.4268, 26.1025},
            "cluj", new double[]{46.7712, 23.6236}

    );
    public List<Animal> semanticSearch(String userQuery, int topN) {
        return enhancedSemanticSearch(userQuery, topN, null);
    }
    public List<Animal> semanticSearch(String userQuery, int topN, List<String> adoptionTypes) {
        return enhancedSemanticSearch(userQuery, topN, adoptionTypes);
    }
    public List<Animal> enhancedSemanticSearch(String userQuery, int topN, List<String> adoptionTypes) {
        List<Float> queryEmbedding = embeddingService.embedTexts(List.of(userQuery)).get(0);
        Map<String, String> extracted = rdfGraphService.extractSpeciesAndLocation(userQuery);
        String species = extracted.get("species");
        String location = extracted.get("location");
        Map<String, User> userMap = userRepository.findAll()
                .stream()
                .collect(Collectors.toMap(User::getId, u -> u));
        List<Animal> animals = getFilteredAnimals(species, adoptionTypes);
        List<Animal> candidates = filterByLocation(animals, location, userMap);
        List<ScoredAnimal> scored = calculateAdaptiveSimilarities(candidates, queryEmbedding, userQuery);

        scored.sort((a, b) -> {
            return Float.compare(b.similarity, a.similarity);
        });

        return scored.stream().limit(topN).map(sa -> sa.animal).collect(Collectors.toList());
    }

    private float calculateKeywordMatchScore(Animal animal, String userQuery) {
        String normalizedQuery = normalizeText(userQuery);
        String[] queryTerms = normalizedQuery.split("\\s+");

        float totalScore = 0f;
        int matchedTerms = 0;

        String normalizedName = normalizeText(animal.getName());
        String normalizedDesc = normalizeText(animal.getDescription());
        String normalizedSpecies = normalizeText(animal.getSpecies());

        List<String> descWords = List.of(normalizedDesc.split("\\W+"));

        for (String term : queryTerms) {
            if (term.length() < 2) continue;

            float termScore = 0f;

            if (normalizedName.equals(term)) termScore += 1.0f;
            else if (normalizedName.contains(term)) termScore += 0.8f;

            boolean descMatched = descWords.stream().anyMatch(word ->
                    commonPrefixLength(word, term) >= 3
            );

            if (descMatched) {
                float lengthBonus = Math.min(0.3f, term.length() * 0.05f);
                termScore += 0.65f + lengthBonus;
            }

            if (normalizedSpecies.contains(term)) termScore += 0.7f;

            if (termScore > 0) {
                totalScore += termScore;
                matchedTerms++;
            }
        }

        if (queryTerms.length > 0) {
            float coverage = (float) matchedTerms / queryTerms.length;
            totalScore = (totalScore / queryTerms.length) * (0.7f + 0.3f * coverage);
        }


        return Math.min(1.0f, totalScore);
    }

    private int commonPrefixLength(String a, String b) {
        int len = Math.min(a.length(), b.length());
        int i = 0;
        while (i < len && a.charAt(i) == b.charAt(i)) {
            i++;
        }
        return i;
    }

    private float[] calculateAdaptiveWeights(String userQuery, Animal animal) {
        float textWeight = BASE_TEXT_EMBEDDING_WEIGHT;
        float rdfWeight = BASE_RDF_EMBEDDING_WEIGHT;

        int queryWordCount = userQuery.trim().split("\\s+").length;
        boolean hasSpecificTerms = containsSpecificAnimalTerms(userQuery);
        boolean hasLocationTerms = containsLocationTerms(userQuery);

        if (queryWordCount <= 3 && hasSpecificTerms) {
            textWeight = 0.4f;
            rdfWeight = 0.6f;
        }
        if (animal.getDescription() != null) {
            int matchCount = countKeywordMatches(userQuery, animal.getDescription());

            if (matchCount >= 2) {
                textWeight = Math.min(1.0f, textWeight + 0.15f);
                rdfWeight = 1.0f - textWeight;
            }
        }
        if (hasLocationTerms) {
            rdfWeight = Math.min(0.5f, rdfWeight + 0.1f);
            textWeight = 1.0f - rdfWeight;
        }


        return new float[]{textWeight, rdfWeight};
    }

    private int countKeywordMatches(String query, String description) {
        String[] queryWords = query.toLowerCase().split("\\s+");
        String[] descriptionWords = description.toLowerCase().split("\\s+");

        Set<String> descriptionSet = new HashSet<>(Arrays.asList(descriptionWords));

        int matchCount = 0;
        for (String word : queryWords) {
            if (descriptionSet.contains(word)) {
                matchCount++;
            }
        }

        return matchCount;
    }

    private boolean containsSpecificAnimalTerms(String query) {
        String normalized = normalizeText(query);
        Set<String> animalTerms = Set.of("pisica", "caine", "catel", "mata", "motan", "feline", "canine");
        return animalTerms.stream().anyMatch(normalized::contains);
    }


    private boolean containsLocationTerms(String query) {
        String normalized = normalizeText(query);
        Set<String> locationTerms = Set.of("bucuresti", "cluj", "zona", "sector", "cartier");
        return locationTerms.stream().anyMatch(normalized::contains);
    }

    private List<ScoredAnimal> calculateAdaptiveSimilarities(List<Animal> candidates,
                                                             List<Float> queryEmbedding,
                                                             String userQuery) {
        List<ScoredAnimal> scored = new ArrayList<>();

        for (Animal animal : candidates) {
            float textSim = 0f;
            float rdfSim = 0f;

            if (animal.getEmbeddings() != null && !animal.getEmbeddings().isEmpty()) {
                textSim = cosineSimilarity(queryEmbedding, animal.getEmbeddings());
            }

            rdfSim = calculateRdfQuerySimilarity(animal.getId(), userQuery);

            float[] weights = calculateAdaptiveWeights(userQuery, animal);
            float keywordScore = calculateKeywordMatchScore(animal, userQuery);
            
            float bonus = keywordScore * 0.5f;
            float combinedSimilarity = weights[0] * textSim + weights[1] * rdfSim + bonus;
            combinedSimilarity = Math.min(1.0f, combinedSimilarity);

            if (combinedSimilarity > 0) {
                scored.add(new ScoredAnimal(animal, combinedSimilarity));
            }
        }

        scored = applyAdditionalScoring(scored, userQuery);

        return scored;
    }


    private List<ScoredAnimal> applyAdditionalScoring(List<ScoredAnimal> scored, String userQuery) {
        String normalizedQuery = normalizeText(userQuery);

        for (ScoredAnimal scoredAnimal : scored) {
            Animal animal = scoredAnimal.animal;
            float bonus = 0f;

            float keywordScore = calculateKeywordMatchScore(animal, userQuery);
            bonus += keywordScore * 0.3f;

            if (animal.getName() != null &&
                    normalizedQuery.contains(normalizeText(animal.getName()))) {
                bonus += 0.2f;
            }

            scoredAnimal.similarity = Math.min(1.0f, scoredAnimal.similarity + bonus);
        }

        return scored;
    }

    public List<Animal> semanticSearch(String userQuery, int topN, SearchMode mode) {
        return semanticSearch(userQuery, topN, mode, null);
    }

    public List<Animal> semanticSearch(String userQuery, int topN, SearchMode mode, List<String> adoptionTypes) {
        switch (mode) {
            case TEXT_ONLY:
                return textOnlySearch(userQuery, topN, adoptionTypes);
            case RDF_ONLY:
                return rdfOnlySearch(userQuery, topN, adoptionTypes);
            case HYBRID:
            default:
                return enhancedSemanticSearch(userQuery, topN, adoptionTypes);
        }
    }

    private List<Animal> textOnlySearch(String userQuery, int topN, List<String> adoptionTypes) {
        List<Float> queryEmbedding = embeddingService.embedTexts(List.of(userQuery)).get(0);

        Map<String, String> extracted = rdfGraphService.extractSpeciesAndLocation(userQuery);
        String species = extracted.get("species");
        String location = extracted.get("location");

        Map<String, User> userMap = userRepository.findAll()
                .stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        List<Animal> animals = getFilteredAnimals(species, adoptionTypes);
        List<Animal> candidates = filterByLocation(animals, location, userMap);

        List<ScoredAnimal> scored = new ArrayList<>();
        for (Animal animal : candidates) {
            if (animal.getEmbeddings() != null && !animal.getEmbeddings().isEmpty()) {
                float similarity = cosineSimilarity(queryEmbedding, animal.getEmbeddings());
                if (similarity > 0) {
                    scored.add(new ScoredAnimal(animal, similarity));
                }
            }
        }

        scored = applyAdditionalScoring(scored, userQuery);
        scored.sort((a, b) -> Float.compare(b.similarity, a.similarity));
        return scored.stream().limit(topN).map(sa -> sa.animal).collect(Collectors.toList());
    }

    private List<Animal> rdfOnlySearch(String userQuery, int topN, List<String> adoptionTypes) {
        Map<String, String> extracted = rdfGraphService.extractSpeciesAndLocation(userQuery);
        String species = extracted.get("species");
        String location = extracted.get("location");

        Map<String, User> userMap = userRepository.findAll()
                .stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        List<Animal> animals = getFilteredAnimals(species, adoptionTypes);
        List<Animal> candidates = filterByLocation(animals, location, userMap);

        List<ScoredAnimal> scored = new ArrayList<>();
        for (Animal animal : candidates) {
            float similarity = calculateRdfQuerySimilarity(animal.getId(), userQuery);
            if (similarity > 0) {
                scored.add(new ScoredAnimal(animal, similarity));
            }
        }

        scored.sort((a, b) -> Float.compare(b.similarity, a.similarity));
        return scored.stream().limit(topN).map(sa -> sa.animal).collect(Collectors.toList());
    }

    public List<Animal> findSimilarAnimals(String animalId, int topN) {
        return findSimilarAnimals(animalId, topN, SearchMode.HYBRID, null);
    }

    public List<Animal> findSimilarAnimals(String animalId, int topN, SearchMode mode) {
        return findSimilarAnimals(animalId, topN, mode, null);
    }

    public List<Animal> findSimilarAnimals(String animalId, int topN, SearchMode mode, List<String> adoptionTypes) {
        Optional<Animal> targetAnimal = animalRepository.findById(animalId);
        if (!targetAnimal.isPresent()) {
            return new ArrayList<>();
        }

        Animal target = targetAnimal.get();

        List<Animal> allAnimals;
        if (adoptionTypes != null && !adoptionTypes.isEmpty()) {
            allAnimals = getFilteredAnimalsByAdoptionType(adoptionTypes);
        } else {
            allAnimals = animalRepository.findAll();
        }

        List<ScoredAnimal> scored = new ArrayList<>();

        for (Animal candidate : allAnimals) {
            if (candidate.getId().equals(animalId)) continue; // Skip self

            float similarity = calculateAnimalSimilarity(target, candidate, mode);
            if (similarity > 0) {
                scored.add(new ScoredAnimal(candidate, similarity));
            }
        }

        scored.sort((a, b) -> Float.compare(b.similarity, a.similarity));
        return scored.stream().limit(topN).map(sa -> sa.animal).collect(Collectors.toList());
    }

    private float calculateAnimalSimilarity(Animal animal1, Animal animal2, SearchMode mode) {
        switch (mode) {
            case TEXT_ONLY:
                return calculateTextSimilarity(animal1.getEmbeddings(), animal2.getEmbeddings());

            case RDF_ONLY:
                return calculateRdfSimilarity(animal1.getId(), animal2.getId());

            case HYBRID:
            default:
                float textSim = calculateTextSimilarity(animal1.getEmbeddings(), animal2.getEmbeddings());
                float rdfSim = calculateRdfSimilarity(animal1.getId(), animal2.getId());

                String syntheticQuery = createSyntheticQuery(animal1);
                float[] weights = calculateAdaptiveWeights(syntheticQuery, animal2);

                return weights[0] * textSim + weights[1] * rdfSim;
        }
    }

    private String createSyntheticQuery(Animal animal) {
        StringBuilder query = new StringBuilder();
        if (animal.getSpecies() != null) query.append(animal.getSpecies()).append(" ");
        if (animal.getName() != null) query.append(animal.getName()).append(" ");
        if (animal.getDescription() != null && animal.getDescription().length() > 20) {
            String[] words = animal.getDescription().split("\\s+");
            for (int i = 0; i < Math.min(5, words.length); i++) {
                query.append(words[i]).append(" ");
            }
        }
        return query.toString().trim();
    }

    private float calculateRdfSimilarity(String animalId1, String animalId2) {
        List<Float> embedding1 = rdf2VecService.getStoredRdfEmbedding(animalId1);
        List<Float> embedding2 = rdf2VecService.getStoredRdfEmbedding(animalId2);

        if (embedding1 == null || embedding2 == null ||
                embedding1.isEmpty() || embedding2.isEmpty()) {
            return 0f;
        }

        return cosineSimilarity(embedding1, embedding2);
    }

    private float calculateRdfQuerySimilarity(String animalId, String query) {
        List<Float> animalRdfEmbedding = rdf2VecService.getStoredRdfEmbedding(animalId);
        if (animalRdfEmbedding == null || animalRdfEmbedding.isEmpty()) {
            return 0f;
        }

        List<Animal> rdfSimilar = rdf2VecService.findSimilarAnimalsByRdf(animalId, 50);

        float queryMatchScore = 0f;
        int matchingAnimals = 0;

        for (Animal similarAnimal : rdfSimilar) {
            float animalQueryMatch = calculateAnimalQueryMatch(similarAnimal, query);
            if (animalQueryMatch > 0.3f) {
                queryMatchScore += animalQueryMatch;
                matchingAnimals++;
            }
        }

        if (matchingAnimals > 0) {

            float avgMatchScore = queryMatchScore / matchingAnimals;
            float confidenceBonus = Math.min(0.3f, (float) matchingAnimals / 10f);
            return Math.min(1.0f, avgMatchScore + confidenceBonus);
        }

        Optional<Animal> animalOpt = animalRepository.findById(animalId);
        if (animalOpt.isPresent()) {
            Animal animal = animalOpt.get();

            Map<String, String> extracted = rdfGraphService.extractSpeciesAndLocation(query);
            String querySpecies = extracted.get("species");

            if (querySpecies != null && animal.getSpecies() != null) {
                if (normalizeText(animal.getSpecies()).equals(normalizeText(querySpecies))) {
                    return 0.7f;
                }
            }


            float keywordMatch = calculateKeywordMatchScore(animal, query);
            if (keywordMatch > 0.4f) {
                return keywordMatch * 0.6f;
            }
        }

        List<Animal> queryRepresentativeAnimals = findQueryRepresentativeAnimals(query);
        if (!queryRepresentativeAnimals.isEmpty()) {
            float maxSimilarity = 0f;

            for (Animal representative : queryRepresentativeAnimals) {
                List<Float> repEmbedding = rdf2VecService.getStoredRdfEmbedding(representative.getId());
                if (repEmbedding != null && !repEmbedding.isEmpty()) {
                    float similarity = cosineSimilarity(animalRdfEmbedding, repEmbedding);
                    maxSimilarity = Math.max(maxSimilarity, similarity);
                }
            }

            return maxSimilarity * 0.8f;
        }

        return 0f;
    }

    private float calculateAnimalQueryMatch(Animal animal, String query) {
        float score = 0f;
        String normalizedQuery = normalizeText(query);
        String[] queryTerms = normalizedQuery.split("\\s+");

        if (animal.getSpecies() != null) {
            String normalizedSpecies = normalizeText(animal.getSpecies());
            for (String term : queryTerms) {
                if (normalizedSpecies.contains(term) && term.length() > 2) {
                    score += 0.4f;
                    break;
                }
            }
        }

        if (animal.getName() != null) {
            String normalizedName = normalizeText(animal.getName());
            for (String term : queryTerms) {
                if (normalizedName.contains(term) && term.length() > 2) {
                    score += 0.3f;
                    break;
                }
            }
        }

        if (animal.getDescription() != null) {
            String normalizedDesc = normalizeText(animal.getDescription());
            int descMatches = 0;
            for (String term : queryTerms) {
                if (normalizedDesc.contains(term) && term.length() > 2) {
                    descMatches++;
                }
            }

            if (descMatches > 0) {
                score += Math.min(0.4f, descMatches * 0.1f);
            }
        }

        return Math.min(1.0f, score);
    }


    private List<Animal> findQueryRepresentativeAnimals(String query) {
        String normalizedQuery = normalizeText(query);
        String[] queryTerms = normalizedQuery.split("\\s+");

        List<Animal> representatives = animalRepository.findAll().stream()
                .filter(animal -> {
                    float matchScore = calculateAnimalQueryMatch(animal, query);
                    return matchScore > 0.5f;
                })
                .limit(5)
                .collect(Collectors.toList());

        if (representatives.isEmpty()) {
            Map<String, String> extracted = rdfGraphService.extractSpeciesAndLocation(query);
            String querySpecies = extracted.get("species");

            if (querySpecies != null && !querySpecies.isBlank()) {
                representatives = animalRepository.findAll().stream()
                        .filter(animal -> animal.getSpecies() != null &&
                                normalizeText(animal.getSpecies()).equals(normalizeText(querySpecies)))
                        .limit(3)
                        .collect(Collectors.toList());
            }
        }

        return representatives;
    }

    private float calculateTextSimilarity(List<Float> embedding1, List<Float> embedding2) {
        if (embedding1 == null || embedding2 == null ||
                embedding1.isEmpty() || embedding2.isEmpty()) {
            return 0f;
        }
        return cosineSimilarity(embedding1, embedding2);
    }

    private List<Animal> getFilteredAnimals(String species, List<String> adoptionTypes) {
        List<Animal> animals;

        if (adoptionTypes != null && !adoptionTypes.isEmpty()) {
            System.out.println("Filtering by adoption types: " + adoptionTypes);

            animals = animalRepository.findAll();
            System.out.println("Total animals before adoption type filtering: " + animals.size());

            animals = animals.stream()
                    .filter(animal -> {
                        if (animal.getTypesOfAdoptions() == null || animal.getTypesOfAdoptions().isEmpty()) {
                            return false;
                        }

                        boolean matches = adoptionTypes.stream()
                                .anyMatch(requestedType ->
                                        animal.getTypesOfAdoptions().stream()
                                                .anyMatch(animalType -> {
                                                    String normalizedRequested = normalizeText(requestedType);
                                                    String normalizedAnimal = normalizeText(animalType);

                                                    System.out.println("Comparing: '" + normalizedRequested + "' with '" + normalizedAnimal + "'");

                                                    boolean match = normalizedAnimal.equals(normalizedRequested) ||
                                                            normalizedAnimal.contains(normalizedRequested) ||
                                                            normalizedRequested.contains(normalizedAnimal);

                                                    if (match) {
                                                        System.out.println("MATCH FOUND: '" + normalizedRequested + "' matches '" + normalizedAnimal + "'");
                                                    }

                                                    return match;
                                                })
                                );

                        if (matches) {
                            System.out.println("Animal " + animal.getName() + " matches with types: " + animal.getTypesOfAdoptions());
                        } else {
                            System.out.println("Animal " + animal.getName() + " does NOT match. Requested: " + adoptionTypes + ", Animal has: " + animal.getTypesOfAdoptions());
                        }

                        return matches;
                    })
                    .collect(Collectors.toList());

            System.out.println("Animals after adoption type filtering: " + animals.size());
        } else {
            animals = animalRepository.findAll();
        }


        if (species != null && !species.isBlank()) {
            String normalizedSpecies = species.substring(0, 1).toUpperCase() +
                    species.substring(1).toLowerCase();
            System.out.println("Filtering by species: " + normalizedSpecies);
            animals = animals.stream()
                    .filter(animal -> normalizedSpecies.equals(animal.getSpecies()))
                    .collect(Collectors.toList());
        }

        System.out.println("Total animals after filtering: " + animals.size());
        return animals;
    }

    private List<Animal> getFilteredAnimalsByAdoptionType(List<String> adoptionTypes) {
        if (adoptionTypes == null || adoptionTypes.isEmpty()) {
            return animalRepository.findAll();
        }

        List<Animal> animals = animalRepository.findAll();

        return animals.stream()
                .filter(animal -> {
                    if (animal.getTypesOfAdoptions() == null || animal.getTypesOfAdoptions().isEmpty()) {
                        return false;
                    }

                    return adoptionTypes.stream()
                            .anyMatch(requestedType ->
                                    animal.getTypesOfAdoptions().stream()
                                            .anyMatch(animalType -> {
                                                // Normalize both strings for comparison
                                                String normalizedRequested = normalizeText(requestedType);
                                                String normalizedAnimal = normalizeText(animalType);

                                                // Check for exact match or contains match
                                                return normalizedAnimal.equals(normalizedRequested) ||
                                                        normalizedAnimal.contains(normalizedRequested) ||
                                                        normalizedRequested.contains(normalizedAnimal);
                                            })
                            );
                })
                .collect(Collectors.toList());
    }

    private List<Animal> filterByLocation(List<Animal> animals, String location, Map<String, User> userMap) {
        if (location == null || location.isBlank()) {
            return animals;
        }

        String normalizedLocation = rdfGraphService.normalizeLocation(location);

        if (!CITY_COORDINATES.containsKey(normalizedLocation)) {
            System.out.println("[INFO] No coordinates found for location: " + normalizedLocation + ". Skipping location filter.");
            return animals;
        }

        double[] targetCoords = CITY_COORDINATES.get(normalizedLocation);
        double targetLat = targetCoords[0];
        double targetLon = targetCoords[1];

        double maxDistanceKm = 20.0;

        List<Animal> candidates = new ArrayList<>();
        for (Animal animal : animals) {
            User user = userMap.get(animal.getUserId());
            if (user == null || user.getLocation() == null) continue;

            double lon = user.getLocation().getX();
            double lat = user.getLocation().getY();

            double distance = haversine(lat, lon, targetLat, targetLon);
            if (distance <= maxDistanceKm) {
                candidates.add(animal);
            }
        }
        return candidates;
    }

    private String normalizeText(String text) {
        if (text == null) return "";
        String normalized = Normalizer.normalize(text, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .toLowerCase()
                .trim();
        return normalized;
    }

    private static double haversine(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }


    private float cosineSimilarity(List<Float> v1, List<Float> v2) {
        if (v1.size() != v2.size()) {
            return 0f;
        }

        float dot = 0, norm1 = 0, norm2 = 0;
        for (int i = 0; i < v1.size(); i++) {
            dot += v1.get(i) * v2.get(i);
            norm1 += v1.get(i) * v1.get(i);
            norm2 += v2.get(i) * v2.get(i);
        }

        if (norm1 == 0 || norm2 == 0) {
            return 0f;
        }

        return (float) (dot / (Math.sqrt(norm1) * Math.sqrt(norm2)));
    }

    public SearchStats getSearchStats() {
        long totalAnimals = animalRepository.count();
        long animalsWithTextEmbeddings = animalRepository.findAll().stream()
                .filter(a -> a.getEmbeddings() != null && !a.getEmbeddings().isEmpty())
                .count();
        long animalsWithRdfEmbeddings = rdf2VecService.getStoredEmbeddingsCount();

        return new SearchStats(totalAnimals, animalsWithTextEmbeddings, animalsWithRdfEmbeddings);
    }


    public enum SearchMode {
        TEXT_ONLY,
        RDF_ONLY,
        HYBRID
    }

    private static class ScoredAnimal {
        Animal animal;
        float similarity;

        ScoredAnimal(Animal a, float sim) {
            this.animal = a;
            this.similarity = sim;
        }
    }

    public static class SearchStats {
        public final long totalAnimals;
        public final long animalsWithTextEmbeddings;
        public final long animalsWithRdfEmbeddings;

        public SearchStats(long total, long withText, long withRdf) {
            this.totalAnimals = total;
            this.animalsWithTextEmbeddings = withText;
            this.animalsWithRdfEmbeddings = withRdf;
        }

        @Override
        public String toString() {
            return String.format("SearchStats{total=%d, textEmb=%d, rdfEmb=%d}",
                    totalAnimals, animalsWithTextEmbeddings, animalsWithRdfEmbeddings);
        }
    }
}