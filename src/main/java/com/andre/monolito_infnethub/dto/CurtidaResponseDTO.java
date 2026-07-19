package com.andre.monolito_infnethub.dto;

import com.andre.monolito_infnethub.model.Curtida;

public record CurtidaResponseDTO(Long usuarioId, String usuarioNome) {
    public static CurtidaResponseDTO fromEntity(Curtida c) {
        return new CurtidaResponseDTO(c.getUsuario().getId(), c.getUsuario().getNome());
    }
}
