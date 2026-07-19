package com.andre.monolito_infnethub.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ComentarioRequestDTO(
        @NotBlank(message = "Conteúdo é obrigatório") String conteudo,
        @NotNull(message = "ID do autor é obrigatório") Long autorId
) {}
