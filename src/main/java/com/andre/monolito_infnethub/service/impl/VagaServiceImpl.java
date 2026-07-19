package com.andre.monolito_infnethub.service.impl;

import com.andre.monolito_infnethub.dto.VagaRequestDTO;
import com.andre.monolito_infnethub.dto.VagaResponseDTO;
import com.andre.monolito_infnethub.dto.historico.PaginaDTO;
import com.andre.monolito_infnethub.exception.ResourceNotFoundException;
import com.andre.monolito_infnethub.model.TipoVaga;
import com.andre.monolito_infnethub.model.Usuario;
import com.andre.monolito_infnethub.model.Vaga;
import com.andre.monolito_infnethub.repository.UsuarioRepository;
import com.andre.monolito_infnethub.repository.VagaRepository;
import com.andre.monolito_infnethub.service.VagaService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VagaServiceImpl implements VagaService {

    private final VagaRepository vagaRepository;
    private final UsuarioRepository usuarioRepository;

    @Override
    @Transactional(readOnly = true)
    public List<VagaResponseDTO> listarAtivas() {
        return vagaRepository.findAllAtivasWithCriador()
                .stream().map(VagaResponseDTO::fromEntity).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PaginaDTO<VagaResponseDTO> listarAtivasPaginado(Pageable pageable) {
        return PaginaDTO.de(vagaRepository.findByAtivoTrueOrderByCriadoEmDesc(pageable),
                VagaResponseDTO::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VagaResponseDTO> listarPorTipo(String tipo) {
        TipoVaga tipoVaga = TipoVaga.valueOf(tipo.toUpperCase());
        return vagaRepository.findByTipoWithCriador(tipoVaga)
                .stream().map(VagaResponseDTO::fromEntity).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public VagaResponseDTO buscarPorId(Long id) {
        return vagaRepository.findByIdWithCriador(id)
                .map(VagaResponseDTO::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Vaga não encontrada: " + id));
    }

    @Override
    @Transactional
    public VagaResponseDTO criar(VagaRequestDTO dto) {
        Usuario criador = usuarioRepository.findById(dto.criadorId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + dto.criadorId()));

        Vaga vaga = Vaga.builder()
                .titulo(dto.titulo())
                .empresa(dto.empresa())
                .descricao(dto.descricao())
                .localizacao(dto.localizacao())
                .tipo(TipoVaga.valueOf(dto.tipo()))
                .categoria(dto.categoria())
                .criador(criador)
                .build();

        return VagaResponseDTO.fromEntity(vagaRepository.save(vaga));
    }

    @Override
    @Transactional
    public VagaResponseDTO atualizar(Long id, VagaRequestDTO dto) {
        Vaga vaga = vagaRepository.findByIdWithCriador(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vaga não encontrada: " + id));

        vaga.setTitulo(dto.titulo());
        vaga.setEmpresa(dto.empresa());
        vaga.setDescricao(dto.descricao());
        vaga.setLocalizacao(dto.localizacao());
        vaga.setTipo(TipoVaga.valueOf(dto.tipo()));
        vaga.setCategoria(dto.categoria());

        return VagaResponseDTO.fromEntity(vagaRepository.save(vaga));
    }

    @Override
    @Transactional
    public void deletar(Long id) {
        Vaga vaga = vagaRepository.findByIdWithCriador(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vaga não encontrada: " + id));
        vaga.setAtivo(false);
        vagaRepository.save(vaga);
    }
}
