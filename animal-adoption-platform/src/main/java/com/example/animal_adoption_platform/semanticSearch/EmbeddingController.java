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

//    private final RDFGraphService rdfGraph;
//    private final EmbeddingService embeddingService;
//
//    @Autowired
//    public EmbeddingController(RDFGraphService rdfGraph, EmbeddingService embeddingService) {
//        this.rdfGraph = rdfGraph;
//        this.embeddingService = embeddingService;
//    }
//
//    @GetMapping("/descriptions")
//    public List<List<Float>> getEmbeddingsForDescriptions() {
//        // Ensure the RDF model is initialized before extracting descriptions!
//        rdfGraph.generateRDFGraph();
//
//        List<String> descriptions = rdfGraph.getAllDescriptionsFromRDF();
//        System.out.println(descriptions);
//        return embeddingService.embedTexts(descriptions);
//    }
//
//    @PostMapping("/update-all")
//    public void updateAllAnimalEmbeddings() {
//        embeddingService.updateAllAnimalEmbeddings();
//    }
//
//    @GetMapping("/rdf-test")
//    public List<String> testRDFFiltering(@RequestParam String query) {
//        rdfGraph.generateRDFGraph();
//        System.out.println(rdfGraph.getAllDescriptionsFromRDF());
//        List<org.apache.jena.rdf.model.Resource> results = rdfGraph.getAnimalsMatchingQuery(query);
//
//        return results.stream().map(r -> r.getURI()).toList();
//    }
    @Autowired
    private SemanticSearchService semanticSearchService;

    @GetMapping("/semantic-search")
    public List<Animal> semanticSearch(@RequestParam String query, @RequestParam(defaultValue = "5") int topN) {
        return semanticSearchService.semanticSearch(query, topN);
    }


    @Autowired
    private RDF2VecService rdf2VecService;

    @PostMapping("/train-and-update")
    public String trainAndUpdate() {
        rdf2VecService.trainRDF2VecModel(); // Train first
        rdf2VecService.updateAnimalRdfEmbeddings(); // Then update
        return "RDF2Vec model trained and embeddings updated.";
    }


    @GetMapping("/status")
    public Map<String, Object> getStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("modelTrained", rdf2VecService.isModelTrained());
        status.put("vocabularySize", rdf2VecService.getVocabularySize());
        status.put("embeddingDimension", rdf2VecService.getEmbeddingDimension());
        status.put("storedEmbeddings", rdf2VecService.getStoredEmbeddingsCount());
        return status;
    }


}
