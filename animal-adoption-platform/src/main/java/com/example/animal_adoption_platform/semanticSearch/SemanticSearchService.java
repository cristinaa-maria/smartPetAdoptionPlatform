package com.example.animal_adoption_platform.semanticSearch;

import com.example.animal_adoption_platform.model.Animal;
import com.example.animal_adoption_platform.model.User;
import com.example.animal_adoption_platform.repository.AnimalRepository;
import com.example.animal_adoption_platform.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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

    private static final float TEXT_EMBEDDING_WEIGHT = 0.5f;
    private static final float RDF_EMBEDDING_WEIGHT = 0.5f;

    // Map of city name (normalized, lowercase, NO diacritics) -> [latitude, longitude]
    private static final Map<String, double[]> CITY_COORDINATES = Map.of(
            "bucuresti", new double[]{44.4268, 26.1025},
            "cluj", new double[]{46.7712, 23.6236}
            // Add more as needed
    );

    /**
     * Enhanced semantic search using both text embeddings and RDF2Vec embeddings
     */
    public List<Animal> semanticSearch(String userQuery, int topN) {
        return semanticSearch(userQuery, topN, SearchMode.HYBRID);
    }

    /**
     * Semantic search with configurable search mode
     */
    public List<Animal> semanticSearch(String userQuery, int topN, SearchMode mode) {
        // 1. Generate embedding for query
        List<Float> queryEmbedding = embeddingService.embedTexts(List.of(userQuery)).get(0);

        // 2. Extract species/location from query
        Map<String, String> extracted = rdfGraphService.extractSpeciesAndLocation(userQuery);
        String species = extracted.get("species");
        String location = extracted.get("location");

        // 3. Get users in a map for quick lookup
        Map<String, User> userMap = userRepository.findAll()
                .stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        // 4. Get animals of matching species (or all if species is null)
        List<Animal> animals = getFilteredAnimals(species);

        // 5. Filter by location if specified and known
        List<Animal> candidates = filterByLocation(animals, location, userMap);

        // 6. Calculate similarities based on search mode
        List<ScoredAnimal> scored = calculateSimilarities(candidates, queryEmbedding, userQuery, mode);

        // 7. Sort and return top N results
        scored.sort((a, b) -> Float.compare(b.similarity, a.similarity));
        return scored.stream().limit(topN).map(sa -> sa.animal).collect(Collectors.toList());
    }

    /**
     * Find similar animals to a given animal using both embedding types
     */
    public List<Animal> findSimilarAnimals(String animalId, int topN) {
        return findSimilarAnimals(animalId, topN, SearchMode.HYBRID);
    }

    /**
     * Find similar animals with configurable search mode
     */
    public List<Animal> findSimilarAnimals(String animalId, int topN, SearchMode mode) {
        Optional<Animal> targetAnimal = animalRepository.findById(animalId);
        if (!targetAnimal.isPresent()) {
            return new ArrayList<>();
        }

        Animal target = targetAnimal.get();
        List<Animal> allAnimals = animalRepository.findAll();
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
                return combineScores(textSim, rdfSim);
        }
    }

    /**
     * Calculate similarities for query-based search
     */
    private List<ScoredAnimal> calculateSimilarities(List<Animal> candidates, List<Float> queryEmbedding,
                                                     String userQuery, SearchMode mode) {
        List<ScoredAnimal> scored = new ArrayList<>();

        for (Animal animal : candidates) {
            float similarity = 0f;

            switch (mode) {
                case TEXT_ONLY:
                    if (animal.getEmbeddings() != null && !animal.getEmbeddings().isEmpty()) {
                        similarity = cosineSimilarity(queryEmbedding, animal.getEmbeddings());
                    }
                    break;

                case RDF_ONLY:
                    // For RDF-only search, we use the animal's RDF embedding similarity
                    // Since we don't have a direct query RDF embedding, we use text-to-RDF mapping
                    similarity = calculateRdfQuerySimilarity(animal.getId(), userQuery);
                    break;

                case HYBRID:
                default:
                    float textSim = 0f;
                    float rdfSim = 0f;

                    // Text embedding similarity
                    if (animal.getEmbeddings() != null && !animal.getEmbeddings().isEmpty()) {
                        textSim = cosineSimilarity(queryEmbedding, animal.getEmbeddings());
                    }

                    // RDF embedding similarity
                    rdfSim = calculateRdfQuerySimilarity(animal.getId(), userQuery);

                    similarity = combineScores(textSim, rdfSim);
                    break;
            }

            if (similarity > 0) {
                scored.add(new ScoredAnimal(animal, similarity));
            }
        }

        return scored;
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
    private float calculateRdfQuerySimilarity(String animalId, String query) {
        // Strategy 1: Use most similar animals from RDF2Vec and check if target is among them
        List<Animal> rdfSimilar = rdf2VecService.findSimilarAnimalsByRdf(animalId, 50);

        // Create a simple relevance score based on RDF similarity rank
        for (int i = 0; i < rdfSimilar.size(); i++) {
            if (rdfSimilar.get(i).getId().equals(animalId)) {
                return 1.0f - (float) i / rdfSimilar.size(); // Higher score for higher rank
            }
        }

        // Strategy 2: If no direct match, use a baseline similarity
        List<Float> animalRdfEmbedding = rdf2VecService.getStoredRdfEmbedding(animalId);
        if (animalRdfEmbedding != null && !animalRdfEmbedding.isEmpty()) {
            // Use average embedding as a baseline (this is a simplified approach)
            return 0.1f; // Small baseline score
        }

        return 0f;
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
     * Combine text and RDF similarity scores
     */
    private float combineScores(float textSimilarity, float rdfSimilarity) {
        return TEXT_EMBEDDING_WEIGHT * textSimilarity + RDF_EMBEDDING_WEIGHT * rdfSimilarity;
    }

    /**
     * Get filtered animals by species
     */
    private List<Animal> getFilteredAnimals(String species) {
        if (species != null && !species.isBlank()) {
            String normalizedSpecies = species.substring(0, 1).toUpperCase() +
                    species.substring(1).toLowerCase();
            System.out.println("Filtering by species: " + normalizedSpecies);
            return animalRepository.findBySpecies(normalizedSpecies);
        } else {
            return animalRepository.findAll();
        }
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
        HYBRID        // Combine both embedding types
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
