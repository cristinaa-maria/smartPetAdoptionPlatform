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

    // Base weights for adaptive system
    private static final float BASE_TEXT_EMBEDDING_WEIGHT = 0.8f;
    private static final float BASE_RDF_EMBEDDING_WEIGHT = 0.2f;

    // Map of city name (normalized, lowercase, NO diacritics) -> [latitude, longitude]
    private static final Map<String, double[]> CITY_COORDINATES = Map.of(
            "bucuresti", new double[]{44.4268, 26.1025},
            "cluj", new double[]{46.7712, 23.6236}
            // Add more as needed
    );

    /**
     * Enhanced semantic search with adaptive weighting
     */
    public List<Animal> semanticSearch(String userQuery, int topN) {
        return enhancedSemanticSearch(userQuery, topN, null);
    }

    /**
     * Enhanced semantic search with adoption type filtering
     */
    public List<Animal> semanticSearch(String userQuery, int topN, List<String> adoptionTypes) {
        return enhancedSemanticSearch(userQuery, topN, adoptionTypes);
    }

    /**
     * Enhanced semantic search using adaptive weighting system with keyword matching and adoption type filtering
     */
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

    /**
     * Enhanced keyword matching with better scoring for exact term matches
     */
    private float calculateKeywordMatchScore(Animal animal, String userQuery) {
        String normalizedQuery = normalizeText(userQuery);
        String[] queryTerms = normalizedQuery.split("\\s+");

        float totalScore = 0f;
        int matchedTerms = 0;

        // Check matches in different fields with different weights
        String normalizedName = normalizeText(animal.getName());
        String normalizedDesc = normalizeText(animal.getDescription());
        String normalizedSpecies = normalizeText(animal.getSpecies());

        // Tokenize descrierea în cuvinte
        List<String> descWords = List.of(normalizedDesc.split("\\W+"));

        for (String term : queryTerms) {
            if (term.length() < 2) continue;

            float termScore = 0f;

            // MATCH în nume
            if (normalizedName.equals(term)) termScore += 1.0f;
            else if (normalizedName.contains(term)) termScore += 0.8f;

            // MATCH în descriere prin prefixe
            boolean descMatched = descWords.stream().anyMatch(word ->
                    commonPrefixLength(word, term) >= 3
            );

            if (descMatched) {
                float lengthBonus = Math.min(0.3f, term.length() * 0.05f);
                termScore += 0.65f + lengthBonus;
            }

            // MATCH în specie
            if (normalizedSpecies.contains(term)) termScore += 0.7f;

            if (termScore > 0) {
                totalScore += termScore;
                matchedTerms++;
            }
        }

        // Normalize by query length and add coverage bonus
        if (queryTerms.length > 0) {
            float coverage = (float) matchedTerms / queryTerms.length;
            totalScore = (totalScore / queryTerms.length) * (0.7f + 0.3f * coverage);
        }
        System.out.println("→ Keyword score for " + animal.getName() + ": " + totalScore);


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


    /**
     * Adaptive weighting system based on query characteristics
     */
    private float[] calculateAdaptiveWeights(String userQuery, Animal animal) {
        float textWeight = BASE_TEXT_EMBEDDING_WEIGHT;
        float rdfWeight = BASE_RDF_EMBEDDING_WEIGHT;

        // Analyze query complexity and adjust weights
        int queryWordCount = userQuery.trim().split("\\s+").length;
        boolean hasSpecificTerms = containsSpecificAnimalTerms(userQuery);
        boolean hasLocationTerms = containsLocationTerms(userQuery);

        // For short, specific queries - favor RDF (structured relationships)
        if (queryWordCount <= 3 && hasSpecificTerms) {
            textWeight = 0.4f;
            rdfWeight = 0.6f;
        }
        // For longer, descriptive queries - favor text embeddings
        if (animal.getDescription() != null) {
            int matchCount = countKeywordMatches(userQuery, animal.getDescription());

            // Dacă sunt cel puțin 2 potriviri semantice/cheie, acordăm bonus
            if (matchCount >= 2) {
                textWeight = Math.min(1.0f, textWeight + 0.15f);
                rdfWeight = 1.0f - textWeight;
            }
        }
        // If query contains location terms, slightly favor RDF
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
            // (opțional) aici poți include și sinonime sau stem-uri dacă folosești NLP
        }

        return matchCount;
    }
    /**
     * Helper method to detect specific animal terms in query
     */
    private boolean containsSpecificAnimalTerms(String query) {
        String normalized = normalizeText(query);
        Set<String> animalTerms = Set.of("pisica", "caine", "catel", "maca", "motan", "feline", "canine");
        return animalTerms.stream().anyMatch(normalized::contains);
    }

    /**
     * Helper method to detect location terms in query
     */
    private boolean containsLocationTerms(String query) {
        String normalized = normalizeText(query);
        Set<String> locationTerms = Set.of("bucuresti", "cluj", "zona", "sector", "cartier");
        return locationTerms.stream().anyMatch(normalized::contains);
    }

    /**
     * Calculate similarities using adaptive weighting
     */
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

            System.out.println("Scor RDF: " + rdfSim);
            System.out.println("Scor text: " + textSim);
            float[] weights = calculateAdaptiveWeights(userQuery, animal);
            float keywordScore = calculateKeywordMatchScore(animal, userQuery);
            scored = applyAdditionalScoring(scored, userQuery);

            float bonus = keywordScore * 2.5f;
            float combinedSimilarity = weights[0] * textSim + weights[1] * rdfSim + bonus;
            combinedSimilarity = Math.min(1.0f, combinedSimilarity);

            if (combinedSimilarity > 0) {
                scored.add(new ScoredAnimal(animal, combinedSimilarity));
            }

        }

        return scored;
    }

    /**
     * Updated applyAdditionalScoring method with enhanced keyword matching
     */
    private List<ScoredAnimal> applyAdditionalScoring(List<ScoredAnimal> scored, String userQuery) {
        String normalizedQuery = normalizeText(userQuery);

        for (ScoredAnimal scoredAnimal : scored) {
            Animal animal = scoredAnimal.animal;
            float bonus = 0f;

            // Enhanced keyword matching score
            float keywordScore = calculateKeywordMatchScore(animal, userQuery);
            bonus += keywordScore * 0.3f; // Give significant weight to keyword matches

            // Original exact name match bonus (keeping for backward compatibility)
            if (animal.getName() != null &&
                    normalizedQuery.contains(normalizeText(animal.getName()))) {
                bonus += 0.2f;
            }

            // Apply bonus (capped at reasonable limit)
            scoredAnimal.similarity = Math.min(1.0f, scoredAnimal.similarity + bonus);
        }

        return scored;
    }


    /**
     * Semantic search with configurable search mode (backward compatibility)
     */
    public List<Animal> semanticSearch(String userQuery, int topN, SearchMode mode) {
        return semanticSearch(userQuery, topN, mode, null);
    }

    /**
     * Semantic search with configurable search mode and adoption type filtering
     */
    public List<Animal> semanticSearch(String userQuery, int topN, SearchMode mode, List<String> adoptionTypes) {
        // For backward compatibility, delegate to mode-specific methods
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

    /**
     * Text-only search implementation with adoption type filtering
     */
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

    /**
     * RDF-only search implementation with adoption type filtering
     */
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

    /**
     * Find similar animals to a given animal using enhanced approach
     */
    public List<Animal> findSimilarAnimals(String animalId, int topN) {
        return findSimilarAnimals(animalId, topN, SearchMode.HYBRID, null);
    }

    /**
     * Find similar animals with configurable search mode
     */
    public List<Animal> findSimilarAnimals(String animalId, int topN, SearchMode mode) {
        return findSimilarAnimals(animalId, topN, mode, null);
    }

    /**
     * Find similar animals with configurable search mode and adoption type filtering
     */
    public List<Animal> findSimilarAnimals(String animalId, int topN, SearchMode mode, List<String> adoptionTypes) {
        Optional<Animal> targetAnimal = animalRepository.findById(animalId);
        if (!targetAnimal.isPresent()) {
            return new ArrayList<>();
        }

        Animal target = targetAnimal.get();

        // Get all animals with adoption type filtering if specified
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

    /**
     * Calculate similarity between two animals based on search mode
     */
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

                // Use adaptive weighting for animal-to-animal similarity as well
                // Create a synthetic query based on animal1's attributes for weighting
                String syntheticQuery = createSyntheticQuery(animal1);
                float[] weights = calculateAdaptiveWeights(syntheticQuery, animal2);

                return weights[0] * textSim + weights[1] * rdfSim;
        }
    }

    /**
     * Create a synthetic query from animal attributes for similarity calculations
     */
    private String createSyntheticQuery(Animal animal) {
        StringBuilder query = new StringBuilder();
        if (animal.getSpecies() != null) query.append(animal.getSpecies()).append(" ");
        if (animal.getName() != null) query.append(animal.getName()).append(" ");
        if (animal.getDescription() != null && animal.getDescription().length() > 20) {
            // Take first few words from description
            String[] words = animal.getDescription().split("\\s+");
            for (int i = 0; i < Math.min(5, words.length); i++) {
                query.append(words[i]).append(" ");
            }
        }
        return query.toString().trim();
    }

    /**
     * Calculate RDF similarity between two animals
     */
    private float calculateRdfSimilarity(String animalId1, String animalId2) {
        List<Float> embedding1 = rdf2VecService.getStoredRdfEmbedding(animalId1);
        List<Float> embedding2 = rdf2VecService.getStoredRdfEmbedding(animalId2);

        if (embedding1 == null || embedding2 == null ||
                embedding1.isEmpty() || embedding2.isEmpty()) {
            return 0f;
        }

        return cosineSimilarity(embedding1, embedding2);
    }

    /**
     * Calculate RDF similarity for query-based search
     */
    /**
     * Calculate RDF similarity for query-based search - FIXED VERSION
     */
    private float calculateRdfQuerySimilarity(String animalId, String query) {
        // Get the animal's RDF embedding
        List<Float> animalRdfEmbedding = rdf2VecService.getStoredRdfEmbedding(animalId);
        if (animalRdfEmbedding == null || animalRdfEmbedding.isEmpty()) {
            return 0f;
        }

        // Strategy 1: Use most similar animals from RDF2Vec and check if target is among them
        List<Animal> rdfSimilar = rdf2VecService.findSimilarAnimalsByRdf(animalId, 50);

        // Create a relevance score based on how well the query matches the similar animals
        float queryMatchScore = 0f;
        int matchingAnimals = 0;

        for (Animal similarAnimal : rdfSimilar) {
            // Calculate how well this similar animal matches the query
            float animalQueryMatch = calculateAnimalQueryMatch(similarAnimal, query);
            if (animalQueryMatch > 0.3f) { // Only consider good matches
                queryMatchScore += animalQueryMatch;
                matchingAnimals++;
            }
        }

        if (matchingAnimals > 0) {
            // Average the match scores and apply position-based weighting
            float avgMatchScore = queryMatchScore / matchingAnimals;
            // Scale by how many similar animals matched (more matches = more confidence)
            float confidenceBonus = Math.min(0.3f, (float) matchingAnimals / 10f);
            return Math.min(1.0f, avgMatchScore + confidenceBonus);
        }

        // Strategy 2: Direct attribute matching with RDF context
        Optional<Animal> animalOpt = animalRepository.findById(animalId);
        if (animalOpt.isPresent()) {
            Animal animal = animalOpt.get();

            // Check species match
            Map<String, String> extracted = rdfGraphService.extractSpeciesAndLocation(query);
            String querySpecies = extracted.get("species");

            if (querySpecies != null && animal.getSpecies() != null) {
                if (normalizeText(animal.getSpecies()).equals(normalizeText(querySpecies))) {
                    return 0.7f;
                }
            }

            // Check keyword matching in animal attributes
            float keywordMatch = calculateKeywordMatchScore(animal, query);
            if (keywordMatch > 0.4f) {
                return keywordMatch * 0.6f; // Scale down since it's not pure RDF matching
            }
        }

        // Strategy 3: Use RDF embedding similarity with query-representative animals
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

            return maxSimilarity * 0.8f; // Scale slightly since it's indirect
        }

        return 0f; // No meaningful RDF similarity found
    }

    /**
     * Calculate how well an animal matches a query based on attributes
     */
    private float calculateAnimalQueryMatch(Animal animal, String query) {
        float score = 0f;
        String normalizedQuery = normalizeText(query);
        String[] queryTerms = normalizedQuery.split("\\s+");

        // Check species match
        if (animal.getSpecies() != null) {
            String normalizedSpecies = normalizeText(animal.getSpecies());
            for (String term : queryTerms) {
                if (normalizedSpecies.contains(term) && term.length() > 2) {
                    score += 0.4f;
                    break;
                }
            }
        }

        // Check name match
        if (animal.getName() != null) {
            String normalizedName = normalizeText(animal.getName());
            for (String term : queryTerms) {
                if (normalizedName.contains(term) && term.length() > 2) {
                    score += 0.3f;
                    break;
                }
            }
        }

        // Check description match
        if (animal.getDescription() != null) {
            String normalizedDesc = normalizeText(animal.getDescription());
            int descMatches = 0;
            for (String term : queryTerms) {
                if (normalizedDesc.contains(term) && term.length() > 2) {
                    descMatches++;
                }
            }
            // Bonus for multiple description matches
            if (descMatches > 0) {
                score += Math.min(0.4f, descMatches * 0.1f);
            }
        }

        return Math.min(1.0f, score);
    }

    /**
     * Find animals that are representative of the query for RDF similarity comparison
     */
    private List<Animal> findQueryRepresentativeAnimals(String query) {
        String normalizedQuery = normalizeText(query);
        String[] queryTerms = normalizedQuery.split("\\s+");

        // Find animals that match the query terms well
        List<Animal> representatives = animalRepository.findAll().stream()
                .filter(animal -> {
                    float matchScore = calculateAnimalQueryMatch(animal, query);
                    return matchScore > 0.5f; // Only well-matching animals
                })
                .limit(5) // Limit to avoid too many comparisons
                .collect(Collectors.toList());

        // If no good matches, try to find at least species matches
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

    /**
     * Calculate text embedding similarity
     */
    private float calculateTextSimilarity(List<Float> embedding1, List<Float> embedding2) {
        if (embedding1 == null || embedding2 == null ||
                embedding1.isEmpty() || embedding2.isEmpty()) {
            return 0f;
        }
        return cosineSimilarity(embedding1, embedding2);
    }

    /**
     * Get filtered animals by species and adoption types - FIXED VERSION WITH BETTER MATCHING
     */
    private List<Animal> getFilteredAnimals(String species, List<String> adoptionTypes) {
        List<Animal> animals;

        // First filter by adoption types if specified
        if (adoptionTypes != null && !adoptionTypes.isEmpty()) {
            System.out.println("Filtering by adoption types: " + adoptionTypes);

            // Get all animals first
            animals = animalRepository.findAll();
            System.out.println("Total animals before adoption type filtering: " + animals.size());

            // Filter manually to handle diacritics and case-insensitive matching
            animals = animals.stream()
                    .filter(animal -> {
                        if (animal.getTypesOfAdoptions() == null || animal.getTypesOfAdoptions().isEmpty()) {
                            return false;
                        }

                        // Check if any of the requested adoption types match any of the animal's adoption types
                        boolean matches = adoptionTypes.stream()
                                .anyMatch(requestedType ->
                                        animal.getTypesOfAdoptions().stream()
                                                .anyMatch(animalType -> {
                                                    // Normalize both strings for comparison
                                                    String normalizedRequested = normalizeText(requestedType);
                                                    String normalizedAnimal = normalizeText(animalType);

                                                    System.out.println("Comparing: '" + normalizedRequested + "' with '" + normalizedAnimal + "'");

                                                    // Check for exact match or contains match
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

        // Then filter by species if specified
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

    /**
     * Helper method to get filtered animals by adoption type only (for findSimilarAnimals)
     */
    private List<Animal> getFilteredAnimalsByAdoptionType(List<String> adoptionTypes) {
        if (adoptionTypes == null || adoptionTypes.isEmpty()) {
            return animalRepository.findAll();
        }

        // Get all animals first
        List<Animal> animals = animalRepository.findAll();

        // Filter manually to handle diacritics and case-insensitive matching
        return animals.stream()
                .filter(animal -> {
                    if (animal.getTypesOfAdoptions() == null || animal.getTypesOfAdoptions().isEmpty()) {
                        return false;
                    }

                    // Check if any of the requested adoption types match any of the animal's adoption types
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

    /**
     * Filter animals by geolocation (distance to city center)
     */
    private List<Animal> filterByLocation(List<Animal> animals, String location, Map<String, User> userMap) {
        if (location == null || location.isBlank()) {
            return animals;
        }

        // Normalize the location string
        String normalizedLocation = rdfGraphService.normalizeLocation(location);

        if (!CITY_COORDINATES.containsKey(normalizedLocation)) {
            // If we don't have coordinates for this location, skip location filtering
            System.out.println("[INFO] No coordinates found for location: " + normalizedLocation + ". Skipping location filter.");
            return animals;
        }

        double[] targetCoords = CITY_COORDINATES.get(normalizedLocation);
        double targetLat = targetCoords[0];
        double targetLon = targetCoords[1];

        double maxDistanceKm = 20.0; // Animals within 20km of city center

        List<Animal> candidates = new ArrayList<>();
        for (Animal animal : animals) {
            User user = userMap.get(animal.getUserId());
            if (user == null || user.getLocation() == null) continue;

            // GeoJsonPoint: X is longitude, Y is latitude
            double lon = user.getLocation().getX();
            double lat = user.getLocation().getY();

            double distance = haversine(lat, lon, targetLat, targetLon);
            if (distance <= maxDistanceKm) {
                candidates.add(animal);
            }
        }
        System.out.println("[INFO] Found " + candidates.size() + " animals within " + maxDistanceKm +
                "km of " + normalizedLocation + " out of " + animals.size() + " candidates.");
        return candidates;
    }

    /**
     * Enhanced text normalization with diacritics removal
     */
    private String normalizeText(String text) {
        if (text == null) return "";
        String normalized = Normalizer.normalize(text, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .toLowerCase()
                .trim();
        System.out.println("Normalized '" + text + "' to '" + normalized + "'");
        return normalized;
    }

    /**
     * Haversine formula: distance in kilometers between two lat/lon points
     */
    private static double haversine(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371; // Earth radius in km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Calculate cosine similarity between two vectors
     */
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

    /**
     * Get search statistics for debugging and monitoring
     */
    public SearchStats getSearchStats() {
        long totalAnimals = animalRepository.count();
        long animalsWithTextEmbeddings = animalRepository.findAll().stream()
                .filter(a -> a.getEmbeddings() != null && !a.getEmbeddings().isEmpty())
                .count();
        long animalsWithRdfEmbeddings = rdf2VecService.getStoredEmbeddingsCount();

        return new SearchStats(totalAnimals, animalsWithTextEmbeddings, animalsWithRdfEmbeddings);
    }

    /**
     * Search mode enumeration
     */
    public enum SearchMode {
        TEXT_ONLY,    // Use only text embeddings
        RDF_ONLY,     // Use only RDF2Vec embeddings
        HYBRID        // Combine both embedding types with adaptive weighting
    }

    /**
     * Helper class for scoring animals
     */
    private static class ScoredAnimal {
        Animal animal;
        float similarity;

        ScoredAnimal(Animal a, float sim) {
            this.animal = a;
            this.similarity = sim;
        }
    }

    /**
     * Search statistics class
     */
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