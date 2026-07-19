package com.andre.monolito_infnethub.dto;

import com.andre.monolito_infnethub.model.Post;

import java.time.LocalDateTime;

public record PostResponseDTO(
        Long id,
        String titulo,
        String conteudo,
        Long autorId,
        String autorNome,
        String autorEmail,
        String autorPapel,
        String autorPapelDescricao,
        Integer curtidas,
        Long totalComentarios,
        LocalDateTime criadoEm
) {
    public static PostResponseDTO fromEntity(Post post, long totalComentarios) {
        return new PostResponseDTO(
                post.getId(), post.getTitulo(), post.getConteudo(),
                post.getAutor().getId(), post.getAutor().getNome(), post.getAutor().getEmail(),
                post.getAutor().getPapel().name(), post.getAutor().getPapel().getDescricao(),
                post.getCurtidas(), totalComentarios, post.getCriadoEm()
        );
    }
}
