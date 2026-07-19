package com.andre.monolito_infnethub.controller;

import com.andre.monolito_infnethub.dto.CurtidaResponseDTO;
import com.andre.monolito_infnethub.service.CurtidaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/posts/{postId}/curtidas")
@RequiredArgsConstructor
public class CurtidaController {

    private final CurtidaService curtidaService;

    @GetMapping
    public ResponseEntity<List<CurtidaResponseDTO>> listar(@PathVariable Long postId) {
        return ResponseEntity.ok(curtidaService.listarPorPost(postId));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> curtirOuDescurtir(
            @PathVariable Long postId,
            @RequestParam Long usuarioId) {
        CurtidaService.ResultadoCurtida resultado = curtidaService.alternar(postId, usuarioId);
        return ResponseEntity.ok(Map.of("curtido", resultado.curtido(), "total", resultado.total()));
    }
}
