package com.andre.monolito_infnethub.controller;

import com.andre.monolito_infnethub.dto.ComentarioRequestDTO;
import com.andre.monolito_infnethub.dto.ComentarioResponseDTO;
import com.andre.monolito_infnethub.exception.ResourceNotFoundException;
import com.andre.monolito_infnethub.model.Comentario;
import com.andre.monolito_infnethub.model.Post;
import com.andre.monolito_infnethub.model.Usuario;
import com.andre.monolito_infnethub.repository.ComentarioRepository;
import com.andre.monolito_infnethub.repository.PostRepository;
import com.andre.monolito_infnethub.repository.UsuarioRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/posts/{postId}/comentarios")
@RequiredArgsConstructor
public class ComentarioController {

    private final ComentarioRepository comentarioRepository;
    private final PostRepository postRepository;
    private final UsuarioRepository usuarioRepository;

    @GetMapping
    public ResponseEntity<List<ComentarioResponseDTO>> listar(@PathVariable Long postId) {
        return ResponseEntity.ok(
                comentarioRepository.findByPostId(postId)
                        .stream().map(ComentarioResponseDTO::fromEntity).toList()
        );
    }

    @PostMapping
    public ResponseEntity<ComentarioResponseDTO> criar(
            @PathVariable Long postId,
            @Valid @RequestBody ComentarioRequestDTO dto) {

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post não encontrado: " + postId));
        Usuario autor = usuarioRepository.findById(dto.autorId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + dto.autorId()));

        Comentario comentario = Comentario.builder()
                .conteudo(dto.conteudo())
                .post(post)
                .autor(autor)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ComentarioResponseDTO.fromEntity(comentarioRepository.save(comentario)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ComentarioResponseDTO> atualizar(
            @PathVariable Long postId,
            @PathVariable Long id,
            @Valid @RequestBody ComentarioRequestDTO dto) {

        Comentario comentario = comentarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comentário não encontrado: " + id));
        comentario.setConteudo(dto.conteudo());
        return ResponseEntity.ok(ComentarioResponseDTO.fromEntity(comentarioRepository.save(comentario)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long postId, @PathVariable Long id) {
        if (!comentarioRepository.existsById(id)) {
            throw new ResourceNotFoundException("Comentário não encontrado: " + id);
        }
        comentarioRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
