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

    public List<Animal> semanticSearch(String userQuery, int topN) {
        // 1. Generează embedding pentru query
        List<Float> queryEmbedding = embeddingService.embedTexts(List.of(userQuery)).get(0);

        // 2. Extrage species/location din query
        Map<String, String> extracted = rdfGraphService.extractSpeciesAndLocation(userQuery);
        String species = extracted.get("species");
        String location = extracted.get("location");

        // 3. Ia userii într-un map pentru lookup rapid
        Map<String, User> userMap = userRepository.findAll()
                .stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        // 4. Ia animalele de specie potrivită (sau toate dacă species e null)
        List<Animal> animals;
        if (species != null && !species.isBlank()) {
            String normalizedSpecies = species.substring(0, 1).toUpperCase() + species.substring(1).toLowerCase();
            System.out.println(normalizedSpecies);
            animals = animalRepository.findBySpecies(normalizedSpecies);
        } else {
            animals = animalRepository.findAll();
        }

        // 5. Filtrare după locație (dacă e cazul)
        List<Animal> candidates = new ArrayList<>();
        for (Animal animal : animals) {
            if (location == null || location.isBlank()) {
                candidates.add(animal);
                continue;
            }
            User user = userMap.get(animal.getUserId());
            if (user == null || user.getLocation() == null) continue;

            // Folosește helperul tău de normalizare pentru comparație
            String userLocation = "";
            // Dacă User are city explicit, folosește-l
            try {
                userLocation = (String) user.getClass().getMethod("getCity").invoke(user);
            } catch (Exception e) {
                userLocation = user.getLocation().toString(); // fallback la GeoJsonPoint as string
            }
            userLocation = rdfGraphService.normalizeLocation(userLocation);

            if (userLocation.contains(location)) {
                candidates.add(animal);
            }
        }

        // 6. Similaritate cosine embedding query <-> embedding animale
        List<ScoredAnimal> scored = new ArrayList<>();
        for (Animal a : candidates) {
            if (a.getEmbeddings() == null || a.getEmbeddings().isEmpty()) continue;
            float sim = cosineSimilarity(queryEmbedding, a.getEmbeddings());
            scored.add(new ScoredAnimal(a, sim));
        }

        scored.sort((a, b) -> Float.compare(b.similarity, a.similarity));
        return scored.stream().limit(topN).map(sa -> sa.animal).collect(Collectors.toList());
    }

    private float cosineSimilarity(List<Float> v1, List<Float> v2) {
        float dot = 0, norm1 = 0, norm2 = 0;
        for (int i = 0; i < v1.size(); i++) {
            dot += v1.get(i) * v2.get(i);
            norm1 += v1.get(i) * v1.get(i);
            norm2 += v2.get(i) * v2.get(i);
        }
        return (float) (dot / (Math.sqrt(norm1) * Math.sqrt(norm2)));
    }

    private static class ScoredAnimal {
        Animal animal;
        float similarity;
        ScoredAnimal(Animal a, float sim) { this.animal = a; this.similarity = sim; }
    }
}
