package com.example.animal_adoption_platform.semanticSearch;

import com.example.animal_adoption_platform.model.Animal;
import com.example.animal_adoption_platform.model.User;
import com.example.animal_adoption_platform.repository.AnimalRepository;
import com.example.animal_adoption_platform.repository.UserRepository;
import org.apache.jena.query.*;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.ModelFactory;
import org.apache.jena.rdf.model.Resource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;

import java.text.Normalizer;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class RDFGraphService {
    @Autowired
    AnimalRepository animalRepository;
    @Autowired
    UserRepository userRepository;

    private Model model;

    public void generateRDFGraph() {
        model = ModelFactory.createDefaultModel();
        String ns = "http://example.org/adoption#";

        List<User> users = userRepository.findAll();
        List<Animal> animals = animalRepository.findAll();
        Map<String, User> userMap = users.stream().collect(Collectors.toMap(User::getId, u -> u));

        System.out.println("=== GENERATING RDF GRAPH ===");
        System.out.println("Total animals to process: " + animals.size());

        // 1. Create User and Location resources
        for (User user : users) {
            Resource userResource = model.createResource(ns + "user" + user.getId())
                    .addProperty(model.createProperty(ns + "name"), user.getName());

            GeoJsonPoint point = user.getLocation();
            if (point != null) {
                String locId = point.getX() + "_" + point.getY();

                String city = "";
                try {
                    city = (String) user.getClass().getMethod("getCity").invoke(user);
                } catch (Exception e) {
                    city = "";
                }
                city = normalizeLocation(city);

                Resource locationResource = model.createResource(ns + "location" + locId)
                        .addProperty(model.createProperty(ns + "lat"), String.valueOf(point.getY()))
                        .addProperty(model.createProperty(ns + "long"), String.valueOf(point.getX()))
                        .addProperty(model.createProperty(ns + "city"), city);

                userResource.addProperty(model.createProperty(ns + "hasLocation"), locationResource);
            }
        }

        // 2. Create Animal resources and relationships
        for (Animal animal : animals) {
            System.out.println("\n--- Processing Animal: " + animal.getName() + " (ID: " + animal.getId() + ") ---");

            // Get original species from database
            String originalSpecies = animal.getSpecies();
            System.out.println("Original species from DB: '" + originalSpecies + "'");

            // Extract species if not present
            String species = originalSpecies;
            if (species == null || species.isBlank()) {
                String desc = animal.getDescription() != null ? animal.getDescription() : "";
                System.out.println("Description: '" + desc + "'");
                species = extractSpeciesFromText(desc);
                System.out.println("Extracted species from description: '" + species + "'");
            }

            // Normalize species
            if (species != null && !species.isBlank()) {
                species = species.toLowerCase().trim();
            } else {
                species = "";
            }

            System.out.println("Final normalized species: '" + species + "'");

            Resource animalResource = model.createResource(ns + "animal" + animal.getId())
                    .addProperty(model.createProperty(ns + "name"), animal.getName())
                    .addProperty(model.createProperty(ns + "species"), species)
                    .addProperty(model.createProperty(ns + "description"), animal.getDescription() != null ? animal.getDescription() : "");

            // Embedding
            if (animal.getEmbeddings() != null) {
                animalResource.addProperty(model.createProperty(ns + "embedding"), animal.getEmbeddings().toString());
            }

            // Location relationship
            if (animal.getUserId() != null && userMap.containsKey(animal.getUserId())) {
                Resource userResource = model.getResource(ns + "user" + animal.getUserId());
                animalResource.addProperty(model.createProperty(ns + "postedBy"), userResource);

                User user = userMap.get(animal.getUserId());
                GeoJsonPoint point = user.getLocation();
                if (point != null) {
                    String locId = point.getX() + "_" + point.getY();
                    Resource locationResource = model.getResource(ns + "location" + locId);
                    animalResource.addProperty(model.createProperty(ns + "isLocatedIn"), locationResource);
                }
            }
        }

        System.out.println("\n=== RDF GRAPH GENERATION COMPLETE ===");

        // Debug: Print all animals in RDF
        debugAnimalsInRDF();
    }

    private String extractSpeciesFromText(String text) {
        if (text == null || text.isEmpty()) {
            System.out.println("  Text is null or empty");
            return "";
        }

        String normalizedText = normalizeText(text);
        System.out.println("  Extracting species from: '" + text + "'");
        System.out.println("  Normalized text: '" + normalizedText + "'");

        // Cat words - checked FIRST
        List<String> catWords = List.of(
                "pisica", "pisică", "pisicuta", "pisicuţa", "pisicuța",
                "pisoias", "pisoiaș", "pisoiasi", "pisoiași",
                "mâță", "mâta", "matza", "motan", "motanel", "motănel",
                "feline", "felina", "miaulă", "miaună"
        );

        // Check for cat words FIRST
        for (String word : catWords) {
            String normalizedWord = normalizeText(word);
            if (normalizedText.matches(".*\\b" + Pattern.quote(normalizedWord) + "\\b.*")) {
                System.out.println("  ✓ Found cat word: '" + word + "' -> returning 'cat'");
                return "cat";
            }
        }

        // Dog words - checked SECOND
        List<String> dogWords = List.of(
                "catel", "căţel", "cătel", "caine", "căine",
                "catelus", "cățeluș", "catelusul", "cățelușul",
                "catelu", "cățelu", "catetos", "catetos",
                "canine", "canina", "latra", "latră"
        );

        for (String word : dogWords) {
            String normalizedWord = normalizeText(word);
            if (normalizedText.matches(".*\\b" + Pattern.quote(normalizedWord) + "\\b.*")) {
                System.out.println("  ✓ Found dog word: '" + word + "' -> returning 'dog'");
                return "dog";
            }
        }

        System.out.println("  ✗ No species found in text");
        return "";
    }

    private String normalizeText(String text) {
        if (text == null) return "";
        return Normalizer.normalize(text, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .toLowerCase()
                .trim();
    }

    public String normalizeLocation(String location) {
        if (location == null) return "";
        return Normalizer.normalize(location, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .toLowerCase()
                .trim();
    }

    public List<String> getAllDescriptionsFromRDF() {
        String ns = "http://example.org/adoption#";
        return model.listResourcesWithProperty(model.getProperty(ns + "description"))
                .toList()
                .stream()
                .map(res -> res.getProperty(model.getProperty(ns + "description")).getString())
                .collect(Collectors.toList());
    }

    public Map<String, String> extractSpeciesAndLocation(String userQuery) {
        System.out.println("\n=== EXTRACTING FROM USER QUERY ===");
        System.out.println("User query: '" + userQuery + "'");

        Map<String, String> result = new HashMap<>();

        // Cat words for query matching
        List<String> catWords = List.of(
                "pisica", "pisică", "pisicuta", "pisicuţa", "pisicuța",
                "pisoias", "pisoiaș", "pisoiasi", "pisoiași",
                "mâță", "mâta", "matza", "motan", "motanel", "motănel"
        );

        List<String> dogWords = List.of(
                "catel", "căţel", "cătel", "caine", "căine",
                "catelus", "cățeluș", "catelusul", "cățelușul",
                "catelu", "cățelu", "catetos", "catetos"
        );

        String extractedSpecies = null;
        String normalizedQuery = normalizeText(userQuery);
        System.out.println("Normalized query: '" + normalizedQuery + "'");

        // Check for cat words FIRST
        for (String word : catWords) {
            String normalizedWord = normalizeText(word);
            System.out.println("Checking cat word: '" + word + "' (normalized: '" + normalizedWord + "')");
            if (normalizedQuery.matches(".*\\b" + Pattern.quote(normalizedWord) + "\\b.*")) {
                extractedSpecies = "cat";
                System.out.println("✓ FOUND CAT WORD in query: '" + word + "' -> extractedSpecies = 'cat'");
                break;
            }
        }

        // Only check for dog words if no cat word was found
        if (extractedSpecies == null) {
            for (String word : dogWords) {
                String normalizedWord = normalizeText(word);
                System.out.println("Checking dog word: '" + word + "' (normalized: '" + normalizedWord + "')");
                if (normalizedQuery.matches(".*\\b" + Pattern.quote(normalizedWord) + "\\b.*")) {
                    extractedSpecies = "dog";
                    System.out.println("✓ Found dog word in query: '" + word + "'");
                    break;
                }
            }
        }

        // Location extraction (simplified for debugging)
        String extractedLocation = null;
        // ... (keep existing location extraction logic)

        result.put("species", extractedSpecies);
        result.put("location", extractedLocation);

        System.out.println("FINAL EXTRACTION RESULT:");
        System.out.println("  Species: '" + extractedSpecies + "'");
        System.out.println("  Location: '" + extractedLocation + "'");

        return result;
    }

    public List<Resource> getAnimalsMatchingQuery(String userQuery) {
        System.out.println("\n=== ANIMALS MATCHING QUERY ===");

        Map<String, String> extracted = extractSpeciesAndLocation(userQuery);
        String species = extracted.get("species");
        String location = extracted.get("location");

        System.out.println("Query: '" + userQuery + "'");
        System.out.println("Extracted species: '" + species + "'");
        System.out.println("Extracted location: '" + location + "'");

        String ns = "http://example.org/adoption#";
        StringBuilder sparql = new StringBuilder();
        sparql.append("PREFIX : <").append(ns).append(">\n");
        sparql.append("SELECT ?animal ?species ?name WHERE {\n");
        sparql.append("  ?animal :name ?name .\n");
        sparql.append("  ?animal :species ?species .\n");

        // CRITICAL: Only filter by species if we found one
        if (species != null && !species.isEmpty()) {
            sparql.append("  FILTER(?species = \"").append(species).append("\")\n");
            System.out.println("Adding species filter: ?species = \"" + species + "\"");
        } else {
            System.out.println("NO SPECIES FILTER - will return all animals");
        }

        // Location filter
        if (location != null && !location.isEmpty()) {
            sparql.append("  ?animal :isLocatedIn ?loc .\n");
            sparql.append("  ?loc :city ?city .\n");
            sparql.append("  FILTER(CONTAINS(LCASE(?city), \"").append(location).append("\"))\n");
            System.out.println("Adding location filter: " + location);
        }

        sparql.append("}");

        System.out.println("\nGenerated SPARQL Query:");
        System.out.println(sparql.toString());

        Query query = QueryFactory.create(sparql.toString());
        try (QueryExecution qexec = QueryExecutionFactory.create(query, model)) {
            ResultSet results = qexec.execSelect();
            List<Resource> animals = new ArrayList<>();

            System.out.println("\nSPARQL Results:");
            int count = 0;
            while (results.hasNext()) {
                QuerySolution sol = results.next();
                Resource animal = sol.getResource("animal");
                String animalSpecies = sol.getLiteral("species").getString();
                String animalName = sol.getLiteral("name").getString();

                animals.add(animal);
                count++;
                System.out.println("Result #" + count + ": " + animalName + " - Species: '" + animalSpecies + "'");

                // IMPORTANT: Check if this result should be here
                if (species != null && !species.isEmpty() && !species.equals(animalSpecies)) {
                    System.out.println("  ⚠️  WARNING: This animal has species '" + animalSpecies + "' but we filtered for '" + species + "'!");
                }
            }
            System.out.println("Total animals found: " + count);
            return animals;
        } catch (Exception e) {
            System.out.println("SPARQL query failed: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    public Model getModel() {
        if (model == null) {
            generateRDFGraph();
        }
        return model;
    }

    public String dumpRDF() {
        java.io.StringWriter sw = new java.io.StringWriter();
        model.write(sw, "TURTLE");
        return sw.toString();
    }

    public void debugAnimalsInRDF() {
        System.out.println("\n=== ALL ANIMALS IN RDF ===");
        String ns = "http://example.org/adoption#";
        String sparql = "PREFIX : <" + ns + ">\n" +
                "SELECT ?animal ?name ?species WHERE {\n" +
                "  ?animal :name ?name .\n" +
                "  ?animal :species ?species .\n" +
                "} ORDER BY ?name";

        Query query = QueryFactory.create(sparql);
        try (QueryExecution qexec = QueryExecutionFactory.create(query, model)) {
            ResultSet results = qexec.execSelect();
            int count = 0;
            while (results.hasNext()) {
                QuerySolution sol = results.next();
                String name = sol.getLiteral("name").getString();
                String species = sol.getLiteral("species").getString();
                count++;
                System.out.println(count + ". " + name + " - Species: '" + species + "'");
            }
            System.out.println("Total animals in RDF: " + count);
        } catch (Exception e) {
            System.out.println("Error debugging RDF: " + e.getMessage());
        }
        System.out.println("=========================");
    }

    // Helper methods for location extraction (keeping existing ones)
    private boolean isLikelyLocation(String text) {
        if (text == null || text.length() < 3) return false;
        String normalized = normalizeText(text);
        List<String> locationWords = List.of(
                "bucuresti", "constanta", "cluj", "timisoara", "iasi", "brasov",
                "sector", "cartier", "strada", "boulevard", "zona"
        );
        for (String locWord : locationWords) {
            if (normalized.contains(locWord)) return true;
        }
        List<String> animalAdjectives = List.of(
                "vesel", "vesela", "prietenos", "prietenosa", "energic", "energica",
                "iubitor", "iubitoare", "inteligent", "inteligenta", "mic", "mica",
                "mare", "frumos", "frumoasa", "linistit", "linistita", "jucaus", "jucausa"
        );
        for (String adj : animalAdjectives) {
            if (normalizeText(adj).equals(normalized)) return false;
        }
        return true;
    }

    private boolean containsLocationIndicators(String query) {
        String normalized = normalizeText(query);
        List<String> indicators = List.of("in", "din", "la", "sector", "zona", "cartier");
        for (String indicator : indicators) {
            if (normalized.contains(indicator)) return true;
        }
        return false;
    }
}