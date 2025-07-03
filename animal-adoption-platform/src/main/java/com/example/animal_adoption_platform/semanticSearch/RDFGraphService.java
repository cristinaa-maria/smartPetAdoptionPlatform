package com.example.animal_adoption_platform.semanticSearch;

import com.example.animal_adoption_platform.model.Animal;
import com.example.animal_adoption_platform.model.User;
import com.example.animal_adoption_platform.repository.AnimalRepository;
import com.example.animal_adoption_platform.repository.UserRepository;
import org.apache.jena.query.*;
import org.apache.jena.rdf.model.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;

import java.io.FileOutputStream;
import java.io.IOException;
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
        String ns = "http://adoption/";

        List<User> users = userRepository.findAll();
        List<Animal> animals = animalRepository.findAll();
        Map<String, User> userMap = users.stream().collect(Collectors.toMap(User::getId, u -> u));
        for (Animal animal : animals) {
            String originalSpecies = animal.getSpecies();
            String species = originalSpecies;
            if (species == null || species.isBlank()) {
                String desc = animal.getDescription() != null ? animal.getDescription() : "";
                System.out.println("Description: '" + desc + "'");
                species = extractSpeciesFromText(desc);
                System.out.println("Extracted species from description: '" + species + "'");
            }

            if (species != null && !species.isBlank()) {
                species = species.toLowerCase().trim();
            } else {
                species = "";
            }
            Resource animalResource = model.createResource(ns + "animal" + animal.getId())
                    .addProperty(model.createProperty(ns + "name"), animal.getName())
                    .addProperty(model.createProperty(ns + "species"), species)
                    .addProperty(model.createProperty(ns + "description"), animal.getDescription() != null ? animal.getDescription() : "");
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

        List<String> catWords = List.of(
                "pisica", "pisică", "pisicuta", "pisicuţa", "pisicuța",
                "pisoias", "pisoiaș", "pisoiasi", "pisoiași",
                "mâță", "mâta", "matza", "motan", "motanel", "motănel",
                "feline", "felina", "miaulă", "miaună"
        );

        for (String word : catWords) {
            String normalizedWord = normalizeText(word);
            if (normalizedText.matches(".*\\b" + Pattern.quote(normalizedWord) + "\\b.*")) {
                System.out.println("  ✓ Found cat word: '" + word + "' -> returning 'cat'");
                return "cat";
            }
        }

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
        String ns = "http://adoption/";
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

        String normalizedQuery = normalizeText(userQuery);

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

        for (String word : catWords) {
            String normalizedWord = normalizeText(word);
            if (normalizedQuery.matches(".*\\b" + Pattern.quote(normalizedWord) + "\\b.*")) {
                extractedSpecies = "cat";
                break;
            }
        }

        if (extractedSpecies == null) {
            for (String word : dogWords) {
                String normalizedWord = normalizeText(word);
                if (normalizedQuery.matches(".*\\b" + Pattern.quote(normalizedWord) + "\\b.*")) {
                    extractedSpecies = "dog";
                    break;
                }
            }
        }


        List<String> knownCities = List.of(
                "bucuresti", "bucurești", "arad", "cluj", "cluj-napoca", "iasi", "iași",
                "constanta", "constanța", "timisoara", "timișoara", "brasov", "brașov",
                "galati", "galați", "ploiesti", "ploiesti", "craiova", "oradea", "pitesti",
                "sibiu", "baia mare", "buzau", "targu mures", "târgu mureș", "alba iulia"

        );

        String extractedLocation = null;
        for (String city : knownCities) {
            String normalizedCity = normalizeText(city);
            if (normalizedQuery.contains(normalizedCity)) {
                extractedLocation = normalizedCity;
                break;
            }
        }

        if (extractedLocation == null) {
            String[] words = normalizedQuery.split("\\s+");
            for (int i = 0; i < words.length - 1; i++) {
                if (words[i].equals("in") || words[i].equals("din") || words[i].equals("la")) {
                    String maybeCity = words[i + 1];
                    maybeCity = maybeCity.replaceAll("[^a-zăâîșț]", "");
                    if (maybeCity.length() > 2) {
                        extractedLocation = maybeCity;
                        break;
                    }
                }
            }
        }

        result.put("species", extractedSpecies);
        result.put("location", extractedLocation);


        return result;
    }

    public List<Resource> getAnimalsMatchingQuery(String userQuery) {

        Map<String, String> extracted = extractSpeciesAndLocation(userQuery);
        String species = extracted.get("species");
        String location = extracted.get("location");

        System.out.println("Query: '" + userQuery + "'");
        System.out.println("Extracted species: '" + species + "'");
        System.out.println("Extracted location: '" + location + "'");

        String ns = "http://adoption/";
        StringBuilder sparql = new StringBuilder();
        sparql.append("PREFIX : <").append(ns).append(">\n");
        sparql.append("SELECT ?animal ?species ?name WHERE {\n");
        sparql.append("  ?animal :name ?name .\n");
        sparql.append("  ?animal :species ?species .\n");

        if (species != null && !species.isEmpty()) {
            sparql.append("  FILTER(?species = \"").append(species).append("\")\n");
            System.out.println("Adding species filter: ?species = \"" + species + "\"");
        } else {
            System.out.println("NO SPECIES FILTER - will return all animals");
        }

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
        String ns = "http://adoption/";
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


    public List<List<String>> generateRandomWalks(int walkLength, int walksPerNode) {
        String ns = "http://adoption/";
        List<List<String>> walks = new ArrayList<>();

        List<Resource> animalResources = model.listResourcesWithProperty(model.getProperty(ns + "species")).toList();
        Random rnd = new Random();

        for (Resource animal : animalResources) {
            for (int i = 0; i < walksPerNode; i++) {
                List<String> walk = new ArrayList<>();
                Resource current = animal;
                walk.add(current.getURI());
                for (int step = 1; step < walkLength; step++) {
                    StmtIterator stmts = current.listProperties();
                    List<Statement> edges = new ArrayList<>();
                    while (stmts.hasNext()) {
                        edges.add(stmts.next());
                    }
                    if (edges.isEmpty()) break;
                    Statement edge = edges.get(rnd.nextInt(edges.size()));
                    if (edge.getObject().isResource()) {
                        current = edge.getObject().asResource();
                        walk.add(current.getURI());
                    } else {
                        walk.add(edge.getObject().toString());
                        break;
                    }
                }
                walks.add(walk);
            }
        }
        return walks;
    }

    public List<String> getWalkSentences(int walkLength, int walksPerNode) {
        Model m = getModel();
        List<List<String>> walks = generateRandomWalks(walkLength, walksPerNode);
        List<String> sentences = new ArrayList<>();

        for (List<String> walk : walks) {
            sentences.add(String.join(" ", walk));
        }
        return sentences;
    }

//    public void saveRDFToFile(String filename) {
//        try (FileOutputStream out = new FileOutputStream(filename)) {
//            model.write(out, "TURTLE");
//            System.out.println("RDF saved to " + filename);
//        } catch (IOException e) {
//            e.printStackTrace();
//        }
//    }
//

}