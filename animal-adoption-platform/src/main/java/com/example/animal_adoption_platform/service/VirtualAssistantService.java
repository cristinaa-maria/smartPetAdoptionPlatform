package com.example.animal_adoption_platform.service;

import java.util.Arrays;
import java.util.List;

import com.azure.ai.inference.ChatCompletionsClient;
import com.azure.ai.inference.ChatCompletionsClientBuilder;
import com.azure.ai.inference.models.ChatCompletions;
import com.azure.ai.inference.models.ChatCompletionsOptions;
import com.azure.ai.inference.models.ChatRequestMessage;
import com.azure.ai.inference.models.ChatRequestSystemMessage;
import com.azure.ai.inference.models.ChatRequestUserMessage;
import com.azure.core.credential.AzureKeyCredential;
import org.springframework.stereotype.Service;

@Service
public class VirtualAssistantService {

    private final ChatCompletionsClient client;
    private final String model;

    public VirtualAssistantService() {
        String key =  APIKEY;
        String endpoint = "https://models.inference.ai.azure.com";
        this.model = "gpt-4o";

        this.client = new ChatCompletionsClientBuilder()
                .credential(new AzureKeyCredential(key))
                .endpoint(endpoint)
                .buildClient();
    }

    public String generateText(String prompt) {
        List<ChatRequestMessage> chatMessages = Arrays.asList(
                new ChatRequestSystemMessage("Ești un asistent virtual al unei platforme de adopții de animale. " +
                        "Nu poți răspunde la întrebări care nu au legătură cu procesul de adopție sau detalii despre adopție și îngrijirea post-adopție." +
                        "De asemenea, evita raspunsurile foarte lungi si exprimarile care contin sintagme ca 'Sigur', 'Ma bucur ca ai intrebat'"),
                new ChatRequestUserMessage(prompt)
        );

        ChatCompletionsOptions chatCompletionsOptions = new ChatCompletionsOptions(chatMessages);
        chatCompletionsOptions.setModel(model);

        try {
            ChatCompletions completions = client.complete(chatCompletionsOptions);
            return completions.getChoice().getMessage().getContent();
        } catch (Exception e) {
            System.err.println("Error generating text: " + e.getMessage());
            return "Sorry, I couldn't process your request at the moment.";
        }
    }
}