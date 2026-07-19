package com.andre.monolito_infnethub.service.impl;

import com.andre.monolito_infnethub.dto.UsuarioRequestDTO;
import com.andre.monolito_infnethub.dto.UsuarioResponseDTO;
import com.andre.monolito_infnethub.exception.ConflitoDeDadosException;
import com.andre.monolito_infnethub.exception.ResourceNotFoundException;
import com.andre.monolito_infnethub.model.Papel;
import com.andre.monolito_infnethub.model.Usuario;
import com.andre.monolito_infnethub.repository.UsuarioRepository;
import com.andre.monolito_infnethub.service.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UsuarioServiceImpl implements UsuarioService {

    private final UsuarioRepository usuarioRepository;

    @Override
    @Transactional(readOnly = true)
    public List<UsuarioResponseDTO> listarTodos() {
        return usuarioRepository.findAll()
                .stream()
                .map(UsuarioResponseDTO::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<UsuarioResponseDTO> listarPorPapel(Papel papel) {
        return usuarioRepository.findByPapel(papel)
                .stream()
                .map(UsuarioResponseDTO::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<UsuarioResponseDTO> buscar(String termo) {
        return usuarioRepository.buscarPorTermo(termo)
                .stream()
                .map(UsuarioResponseDTO::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public UsuarioResponseDTO buscarPorId(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com id: " + id));
        return UsuarioResponseDTO.fromEntity(usuario);
    }

    @Override
    @Transactional
    public UsuarioResponseDTO criar(UsuarioRequestDTO dto) {
        // Antecipa a constraint uk_usuarios_email para devolver 409 com mensagem
        // de domínio, em vez de deixar a violação subir crua do banco. A checagem
        // não é atômica — duas requisições simultâneas passam juntas por aqui —
        // e por isso a constraint continua sendo a garantia final; o
        // GlobalExceptionHandler traduz quem perder a corrida.
        if (usuarioRepository.existsByEmail(dto.email())) {
            throw new ConflitoDeDadosException("Já existe um usuário cadastrado com o e-mail: " + dto.email());
        }
        return UsuarioResponseDTO.fromEntity(usuarioRepository.save(dto.toEntity()));
    }

    @Override
    @Transactional
    public UsuarioResponseDTO atualizar(Long id, UsuarioRequestDTO dto) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com id: " + id));

        // O e-mail pode permanecer o mesmo: só é conflito se já pertencer a outro usuário.
        usuarioRepository.findByEmail(dto.email())
                .filter(existente -> !existente.getId().equals(id))
                .ifPresent(existente -> {
                    throw new ConflitoDeDadosException("O e-mail " + dto.email() + " já pertence a outro usuário.");
                });

        usuario.setNome(dto.nome());
        usuario.setEmail(dto.email());
        usuario.setEscola(dto.escola());
        usuario.setUltimoBloco(dto.ultimoBloco());
        usuario.setClasse(dto.classe());
        return UsuarioResponseDTO.fromEntity(usuarioRepository.save(usuario));
    }

    @Override
    @Transactional
    public void deletar(Long id) {
        if (!usuarioRepository.existsById(id)) {
            throw new ResourceNotFoundException("Usuário não encontrado com id: " + id);
        }
        // Um usuário com posts, comentários ou curtidas é barrado pelas FKs. A
        // violação vira 409 no handler, e não 500: remover autor preservando o
        // conteúdo dele quebraria a integridade — e o histórico de auditoria
        // continua respondendo por quem ele foi.
        usuarioRepository.deleteById(id);
    }
}
