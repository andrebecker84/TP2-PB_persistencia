package com.andre.monolito_infnethub.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PostRequestDTO(

        @Size(max = 200)
        String titulo,

        @NotBlank(message = "Conteúdo é obrigatório")
        String conteudo,

        @NotNull(message = "ID do autor é obrigatório")
        Long autorId

) {}
