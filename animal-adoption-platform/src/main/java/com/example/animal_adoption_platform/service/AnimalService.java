package com.example.animal_adoption_platform.service;

import com.example.animal_adoption_platform.dto.AnimalDTO;
import com.example.animal_adoption_platform.model.Animal;
import com.example.animal_adoption_platform.model.User;
import com.example.animal_adoption_platform.repository.AnimalRepository;
import com.example.animal_adoption_platform.repository.UserRepository;
import com.mongodb.client.model.geojson.Point;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;


@Service
public class AnimalService {

    private AnimalRepository animalRepository;
    private UserRepository userRepository;

    public AnimalService(AnimalRepository animalRepository, UserRepository userRepository) {
        this.animalRepository = animalRepository;
        this.userRepository  = userRepository;
    }

    public void addAnimal(AnimalDTO animal) {
        Animal animal1 = new Animal();
        animal1.setName(animal.getName());
        animal1.setSpecies(animal.getSpecies());
        animal1.setDescription(animal.getDescription());
        animal1.setUserId(animal.getUserId());
        animal1.setImages(animal.getImages());
        animal1.setTypesOfAdoptions(animal.getTypesOfAdoption());
        animal1.setEmbeddings(animal.getEmbeddings());
        animalRepository.save(animal1);
    }

    public void deleteAnimal(String id) {
        animalRepository.delete(animalRepository.findAnimalById(id));
    }
//
    public Animal updateAnimal(String id, String modifiedField, String modifiedValue){
        Animal animal = animalRepository.findAnimalById(id);

        switch (modifiedField) {
            case "name":
                animal.setName(modifiedValue);
                break;
            case "species":
                animal.setSpecies(modifiedValue);
                break;
            case "description":
                animal.setDescription(modifiedValue);
                break;
            default:
                throw new IllegalArgumentException("Invalid field: " + modifiedField);
        }
        return animalRepository.save(animal);
    }

    public Animal editEmbeddings(String id, List<Float> embeddings){
        Animal animal = animalRepository.findAnimalById(id);
        animal.setEmbeddings(embeddings);
        return animalRepository.save(animal);
    }

    public List<Animal> getAnimals(){
        return animalRepository.findAll();
    }

    public List<Animal> getAnimalsByUserId(String userId){
        return animalRepository.findByUserId(userId);
    }

    public Animal getAnimalInfoById(String id){
        return animalRepository.findAnimalById(id);
    }



}
