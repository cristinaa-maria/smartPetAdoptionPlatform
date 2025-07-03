package com.example.animal_adoption_platform.semanticSearch;

import com.example.animal_adoption_platform.model.Animal;
import com.example.animal_adoption_platform.model.RDF2VecEmbeddings;
import com.example.animal_adoption_platform.repository.AnimalRepository;
import com.example.animal_adoption_platform.repository.RDF2VecEmbeddingsRepository;
import org.apache.jena.rdf.model.Resource;
import org.deeplearning4j.models.word2vec.Word2Vec;
import org.deeplearning4j.text.sentenceiterator.CollectionSentenceIterator;
import org.deeplearning4j.text.sentenceiterator.SentenceIterator;
import org.deeplearning4j.text.tokenization.tokenizer.TokenPreProcess;
import org.deeplearning4j.text.tokenization.tokenizer.Tokenizer;
import org.deeplearning4j.text.tokenization.tokenizerfactory.TokenizerFactory;
import org.deeplearning4j.text.tokenization.tokenizer.TokenPreProcess;
import org.deeplearning4j.text.tokenization.tokenizer.Tokenizer;
import org.deeplearning4j.text.tokenization.tokenizerfactory.TokenizerFactory;

import java.io.InputStream;
import java.util.*;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class RDF2VecService {

    private static final Logger logger = LoggerFactory.getLogger(RDF2VecService.class);

    @Autowired
    private RDFGraphService rdfGraphService;

    @Autowired
    private AnimalRepository animalRepository;

    @Autowired
    private RDF2VecEmbeddingsRepository rdf2VecEmbeddingRepository;

    private Word2Vec word2Vec;
    private Map<String, double[]> nodeEmbeddings;
    private static final int WALK_LENGTH = 8;
    private static final int WALKS_PER_NODE = 10;
    private static final int MIN_WORD_FREQUENCY = 1;
    private static final int LAYER_SIZE = 100;
    private static final int WINDOW_SIZE = 5;
    private static final double LEARNING_RATE = 0.025;
    private static final int EPOCHS = 10;

    public void trainRDF2VecModel() {
        logger.info("Starting RDF2Vec model training...");

        try {

            rdfGraphService.getModel();
            List<String> sentences = rdfGraphService.getWalkSentences(WALK_LENGTH, WALKS_PER_NODE);

            for (int i = 0; i < Math.min(10, sentences.size()); i++) {
                logger.info("Random walk " + i + ": " + sentences.get(i));
            }

            if (sentences.isEmpty()) {
                logger.warn("No random walks generated. Cannot train RDF2Vec model.");
                return;
            }
            logger.info("Generated {} random walk sentences", sentences.size());


            SentenceIterator iterator = new CollectionSentenceIterator(sentences);
            TokenizerFactory tokenizerFactory = new UriWhitespaceTokenizerFactory();

            logger.info("Training Word2Vec model...");
            word2Vec = new Word2Vec.Builder()
                    .minWordFrequency(MIN_WORD_FREQUENCY)
                    .layerSize(LAYER_SIZE)
                    .windowSize(WINDOW_SIZE)
                    .learningRate(LEARNING_RATE)
                    .epochs(EPOCHS)
                    .iterate(iterator)
                    .tokenizerFactory(tokenizerFactory)
                    .build();

            word2Vec.fit();

            logger.info("Word2Vec vocab size: {}", word2Vec.getVocab().numWords());
            List<String> vocabWords = new ArrayList<>(word2Vec.getVocab().words());
            logger.info("Sample vocab: " + vocabWords.stream().limit(20).collect(Collectors.toList()));

            String ns = "http://example.org/adoption#";
            for (Animal animal : animalRepository.findAll()) {
                String animalUri = ns + "animal" + animal.getId();
                logger.info("Word2Vec hasWord({}): {}", animalUri, word2Vec.hasWord(animalUri));
            }

            extractNodeEmbeddings();

            logger.info("RDF2Vec model training completed successfully");

        } catch (Exception e) {
            logger.error("Error training RDF2Vec model", e);
            throw new RuntimeException("Failed to train RDF2Vec model", e);
        }
    }
    private void extractNodeEmbeddings() {
        logger.info("Extracting node embeddings...");

        nodeEmbeddings = new HashMap<>();
        String ns = "http://example.org/adoption#";

        List<Resource> animals = rdfGraphService.getModel()
                .listResourcesWithProperty(rdfGraphService.getModel().getProperty(ns + "species"))
                .toList();

        int embeddingsExtracted = 0;
        for (Resource animal : animals) {
            String nodeUri = animal.getURI();
            if (word2Vec.hasWord(nodeUri)) {
                double[] embedding = word2Vec.getWordVector(nodeUri);
                nodeEmbeddings.put(nodeUri, embedding);
                embeddingsExtracted++;
            }
        }

    }

    public double[] getAnimalRdfEmbedding(String animalId) {
        if (nodeEmbeddings == null) {
            logger.warn("RDF2Vec model not trained. Call trainRDF2VecModel() first.");
            return null;
        }

        String ns = "http://example.org/adoption#";
        String animalUri = ns + "animal" + animalId;

        return nodeEmbeddings.get(animalUri);
    }

//    public void updateAnimalRdfEmbeddings() {
//        trainRDF2VecModel(); // or ensure model is trained/loaded
//
//        // Print total animals and embedding keys before starting
//        List<Animal> animals = animalRepository.findAll();
//        System.out.println("Animals in DB: " + animals.size());
//
//        if (nodeEmbeddings == null || nodeEmbeddings.isEmpty()) {
//            System.out.println("ERROR: nodeEmbeddings is null or empty. Model training may have failed!");
//            return;
//        }
//        System.out.println("nodeEmbeddings keys: " + nodeEmbeddings.keySet());
//
//        int updatedCount = 0;
//        int createdCount = 0;
//        int skippedCount = 0;
//
//        for (Animal animal : animals) {
//            String ns = "http://example.org/adoption#";
//            String animalUri = ns + "animal" + animal.getId();
//            double[] embedding = nodeEmbeddings.get(animalUri);
//
//            // Log the mapping/lookup
//            System.out.println("Processing animalId: " + animal.getId() + " | URI: " + animalUri + " | embedding: " + (embedding != null ? "FOUND" : "NOT FOUND"));
//
//            if (embedding != null) {
//                List<Float> embeddingList = Arrays.stream(embedding)
//                        .mapToObj(d -> (float) d)
//                        .collect(Collectors.toList());
//
//                Optional<RDF2VecEmbeddings> existingEmbedding = rdf2VecEmbeddingRepository.findByAnimalId(animal.getId());
//                if (existingEmbedding.isPresent()) {
//                    RDF2VecEmbeddings rdfEmbedding = existingEmbedding.get();
//                    rdfEmbedding.setEmbeddings(embeddingList);
//                    rdf2VecEmbeddingRepository.save(rdfEmbedding);
//                    updatedCount++;
//                } else {
//                    RDF2VecEmbeddings newEmbedding = new RDF2VecEmbeddings();
//                    newEmbedding.setAnimalId(animal.getId());
//                    newEmbedding.setEmbeddings(embeddingList);
//                    rdf2VecEmbeddingRepository.save(newEmbedding);
//                    createdCount++;
//                }
//            } else {
//                skippedCount++;
//            }
//        }
//
//        // Print a summary after the loop
//        System.out.println("=== RDF2Vec Embedding Save Summary ===");
//        System.out.println("Created: " + createdCount);
//        System.out.println("Updated: " + updatedCount);
//        System.out.println("Skipped (no embedding): " + skippedCount);
//
//        if ((createdCount + updatedCount) == 0) {
//            System.out.println("WARNING: No embeddings were stored! Check your animal URIs and random walks.");
//        }
//    }
    public List<Float> getStoredRdfEmbedding(String animalId) {
        Optional<RDF2VecEmbeddings> embedding = rdf2VecEmbeddingRepository.findByAnimalId(animalId);
        return embedding.map(RDF2VecEmbeddings::getEmbeddings).orElse(null);
    }

    public List<Animal> findSimilarAnimalsByRdf(String animalId, int topK) {
        List<Float> queryEmbedding = getStoredRdfEmbedding(animalId);
        if (queryEmbedding == null || queryEmbedding.isEmpty()) {
            logger.warn("No RDF embedding found for animal ID: {}", animalId);
            return new ArrayList<>();
        }

        float[] queryFloatArray = new float[queryEmbedding.size()];
        for (int i = 0; i < queryEmbedding.size(); i++) {
            queryFloatArray[i] = queryEmbedding.get(i);
        }

        List<Animal> allAnimals = animalRepository.findAll();
        List<SimilarityScore> similarities = new ArrayList<>();

        for (Animal animal : allAnimals) {
            if (animal.getId().equals(animalId)) continue;

            List<Float> animalEmbedding = getStoredRdfEmbedding(animal.getId());
            if (animalEmbedding != null && !animalEmbedding.isEmpty()) {
                float[] animalFloatArray = new float[animalEmbedding.size()];
                for (int i = 0; i < animalEmbedding.size(); i++) {
                    animalFloatArray[i] = animalEmbedding.get(i);
                }

                double similarity = cosineSimilarity(queryFloatArray, animalFloatArray);
                similarities.add(new SimilarityScore(animal, similarity));
            }
        }
        return similarities.stream()
                .sorted((a, b) -> Double.compare(b.similarity, a.similarity))
                .limit(topK)
                .map(s -> s.animal)
                .collect(Collectors.toList());
    }
    public long getStoredEmbeddingsCount() {
        return rdf2VecEmbeddingRepository.count();
    }

    private double cosineSimilarity(float[] vectorA, float[] vectorB) {
        if (vectorA.length != vectorB.length) {
            throw new IllegalArgumentException("Vectors must have the same length");
        }

        double dotProduct = 0.0;
        double normA = 0.0;
        double normB = 0.0;

        for (int i = 0; i < vectorA.length; i++) {
            dotProduct += vectorA[i] * vectorB[i];
            normA += Math.pow(vectorA[i], 2);
            normB += Math.pow(vectorB[i], 2);
        }

        if (normA == 0.0 || normB == 0.0) {
            return 0.0;
        }

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    public int getVocabularySize() {
        return word2Vec != null ? word2Vec.getVocab().numWords() : 0;
    }

    public int getEmbeddingDimension() {
        return LAYER_SIZE;
    }

    public boolean isModelTrained() {
        return word2Vec != null && nodeEmbeddings != null;
    }

    public List<String> getMostSimilarNodes(String nodeUri, int topK) {
        if (word2Vec == null || !word2Vec.hasWord(nodeUri)) {
            return new ArrayList<>();
        }

        try {
            Collection<String> similar = word2Vec.wordsNearest(nodeUri, topK);
            return new ArrayList<>(similar);
        } catch (Exception e) {
            logger.error("Error finding similar nodes for: " + nodeUri, e);
            return new ArrayList<>();
        }
    }

    private static class SimilarityScore {
        final Animal animal;
        final double similarity;

        SimilarityScore(Animal animal, double similarity) {
            this.animal = animal;
            this.similarity = similarity;
        }
    }

    public static class UriWhitespaceTokenizerFactory implements TokenizerFactory {
        private TokenPreProcess preProcessor;

        @Override
        public Tokenizer create(String toTokenize) {
            List<String> tokens = Arrays.asList(toTokenize.split("\\s+"));
            return new Tokenizer() {
                private final Iterator<String> iter = tokens.iterator();

                @Override
                public boolean hasMoreTokens() { return iter.hasNext(); }

                @Override
                public int countTokens() { return tokens.size(); }

                @Override
                public String nextToken() {
                    String token = iter.next();
                    return (preProcessor != null) ? preProcessor.preProcess(token) : token;
                }

                @Override
                public List<String> getTokens() {
                    if (preProcessor != null) {
                        return tokens.stream().map(preProcessor::preProcess).collect(Collectors.toList());
                    }
                    return tokens;
                }

                @Override
                public void setTokenPreProcessor(TokenPreProcess preProcessor) {
                    // Usually not used directly; factory-level handles it
                }


                public TokenPreProcess getTokenPreProcessor() {
                    return preProcessor;
                }
            };
        }

        @Override
        public Tokenizer create(InputStream toTokenize) {
            throw new UnsupportedOperationException("InputStream not supported for this tokenizer");
        }

        @Override
        public void setTokenPreProcessor(TokenPreProcess preProcessor) {
            this.preProcessor = preProcessor;
        }

        @Override
        public TokenPreProcess getTokenPreProcessor() {
            return preProcessor;
        }
    }

}
