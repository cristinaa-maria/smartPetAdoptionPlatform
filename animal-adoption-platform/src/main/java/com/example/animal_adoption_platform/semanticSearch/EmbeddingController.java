package com.example.animal_adoption_platform.semanticSearch;

import com.example.animal_adoption_platform.model.Animal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/embeddings")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class EmbeddingController {


    @Autowired
    private SemanticSearchService semanticSearchService;

    @GetMapping("/semantic-search")
    public List<Animal> semanticSearch(@RequestParam String query, @RequestParam(defaultValue = "5") int topN, @RequestParam List<String> typesOfAdoption) {
        return semanticSearchService.semanticSearch(query, topN, typesOfAdoption);
    }


}
