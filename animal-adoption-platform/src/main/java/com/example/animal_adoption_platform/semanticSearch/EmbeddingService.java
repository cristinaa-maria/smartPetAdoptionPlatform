package com.example.animal_adoption_platform.semanticSearch;

import com.example.animal_adoption_platform.model.Animal;
import com.example.animal_adoption_platform.repository.AnimalRepository;
import com.example.animal_adoption_platform.service.AnimalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import java.util.*;

@Service
public class EmbeddingService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final String OLLAMA_URL = "http://localhost:11434/api/embeddings";
    private final String MODEL_NAME = "nomic-embed-text";

    @Autowired
    private AnimalService animalService;
    @Autowired
    private AnimalRepository animalRepository;

    public List<List<Float>> embedTexts(List<String> texts) {
        List<List<Float>> embeddings = new ArrayList<>();
        for (String text : texts) {
            Map<String, Object> request = Map.of(
                    "model", MODEL_NAME,
                    "prompt", text
            );
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);
            Map<?, ?> response = restTemplate.postForObject(OLLAMA_URL, entity, Map.class);
            List<?> embeddingRaw = (List<?>) response.get("embedding");
            List<Float> embedding = embeddingRaw.stream()
                    .map(val -> ((Number) val).floatValue())
                    .toList();
            embeddings.add(embedding);
        }
        return embeddings;
    }

    public void updateAnimalEmbeddings(List<String> animalIds, List<String> texts) {
        if (animalIds.size() != texts.size()) throw new IllegalArgumentException("Ids and texts must have same size!");
        List<List<Float>> embeddings = embedTexts(texts);
        for (int i = 0; i < animalIds.size(); i++) {
            String id = animalIds.get(i);
            List<Float> emb = embeddings.get(i);
            animalService.editEmbeddings(id, emb);
        }
    }
    public void updateAllAnimalEmbeddings() {
        List<Animal> animals = animalRepository.findAll();
        List<String> animalIds = new ArrayList<>();
        List<String> descriptions = new ArrayList<>();

        for (Animal animal : animals) {
            animalIds.add(animal.getId());
            descriptions.add(animal.getDescription() != null ? animal.getDescription() : "");
        }
        updateAnimalEmbeddings(animalIds, descriptions);
    }
}
