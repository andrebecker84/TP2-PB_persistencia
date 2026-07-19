package com.andre.monolito_infnethub.controller;

import com.andre.monolito_infnethub.dto.UsuarioRequestDTO;
import com.andre.monolito_infnethub.dto.UsuarioResponseDTO;
import com.andre.monolito_infnethub.model.Papel;
import com.andre.monolito_infnethub.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;

    /**
     * Lista os usuários, opcionalmente filtrando por papel.
     *
     * <p>O filtro é parâmetro opcional em vez de rota separada: sem ele o
     * contrato do TP1 continua valendo, e o front-end existente não precisa
     * mudar.
     */
    @GetMapping
    public ResponseEntity<List<UsuarioResponseDTO>> listarTodos(@RequestParam(required = false) Papel papel) {
        return ResponseEntity.ok(papel == null
                ? usuarioService.listarTodos()
                : usuarioService.listarPorPapel(papel));
    }

    /** Busca por nome ou e-mail — sustenta o campo de busca global do front-end. */
    @GetMapping("/buscar")
    public ResponseEntity<List<UsuarioResponseDTO>> buscar(@RequestParam String termo) {
        return ResponseEntity.ok(usuarioService.buscar(termo));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UsuarioResponseDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(usuarioService.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<UsuarioResponseDTO> criar(@Valid @RequestBody UsuarioRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioService.criar(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UsuarioResponseDTO> atualizar(
            @PathVariable Long id,
            @Valid @RequestBody UsuarioRequestDTO dto) {
        return ResponseEntity.ok(usuarioService.atualizar(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        usuarioService.deletar(id);
        return ResponseEntity.noContent().build();
    }
}
