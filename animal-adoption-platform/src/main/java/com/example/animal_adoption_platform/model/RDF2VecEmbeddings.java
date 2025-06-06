package com.example.animal_adoption_platform.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "rdf2vecEmbeddings")
public class RDF2VecEmbeddings {
    @Id
    private String id;
    private String animalId;
    private List<Float> embeddings;
}
