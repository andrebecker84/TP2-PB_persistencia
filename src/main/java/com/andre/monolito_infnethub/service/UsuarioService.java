package com.andre.monolito_infnethub.service;

import com.andre.monolito_infnethub.dto.UsuarioRequestDTO;
import com.andre.monolito_infnethub.dto.UsuarioResponseDTO;
import com.andre.monolito_infnethub.model.Papel;

import java.util.List;

public interface UsuarioService {

    List<UsuarioResponseDTO> listarTodos();

    List<UsuarioResponseDTO> listarPorPapel(Papel papel);

    /** Busca por nome ou e-mail — alimenta o campo de busca global do front-end. */
    List<UsuarioResponseDTO> buscar(String termo);

    UsuarioResponseDTO buscarPorId(Long id);

    UsuarioResponseDTO criar(UsuarioRequestDTO dto);

    UsuarioResponseDTO atualizar(Long id, UsuarioRequestDTO dto);

    void deletar(Long id);
}
