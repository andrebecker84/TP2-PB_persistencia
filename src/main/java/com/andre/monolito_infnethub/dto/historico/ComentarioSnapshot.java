package com.andre.monolito_infnethub.dto.historico;

import com.andre.monolito_infnethub.model.Comentario;
import com.andre.monolito_infnethub.model.Post;
import com.andre.monolito_infnethub.model.Usuario;

/** Estado de um {@link Comentario} em uma revisão. */
public record ComentarioSnapshot(
        Long id,
        String conteudo,
        Long postId,
        Long autorId,
        String autorNome
) {
    public static ComentarioSnapshot de(Comentario c) {
        Post post = c.getPost();
        Usuario autor = c.getAutor();
        return new ComentarioSnapshot(
                c.getId(), c.getConteudo(),
                post != null ? post.getId() : null,
                autor != null ? autor.getId() : null,
                autor != null ? autor.getNome() : null
        );
    }
}
