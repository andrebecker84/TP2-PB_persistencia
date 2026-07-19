package com.andre.monolito_infnethub.repository;

import com.andre.monolito_infnethub.model.Papel;
import com.andre.monolito_infnethub.model.Usuario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.history.RevisionRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Acesso a {@link Usuario}.
 *
 * <p>Combina dois contratos do Spring Data:
 * <ul>
 *   <li>{@link JpaRepository} — CRUD e consultas sobre o estado atual.</li>
 *   <li>{@link RevisionRepository} — histórico sobre {@code usuarios_aud}, sem
 *       nenhuma consulta escrita à mão. O terceiro parâmetro é o tipo do número
 *       da revisão, {@code Integer}, conforme
 *       {@link com.andre.monolito_infnethub.auditoria.RevisaoAuditoria}.</li>
 * </ul>
 */
@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long>,
        RevisionRepository<Usuario, Long, Integer> {

    Optional<Usuario> findByEmail(String email);

    boolean existsByEmail(String email);

    List<Usuario> findByPapel(Papel papel);

    Page<Usuario> findByPapel(Papel papel, Pageable pageable);

    /** Busca por nome ou e-mail, usada pelo campo de busca global do front-end. */
    @Query("""
            SELECT u FROM Usuario u
            WHERE LOWER(u.nome) LIKE LOWER(CONCAT('%', :termo, '%'))
               OR LOWER(u.email) LIKE LOWER(CONCAT('%', :termo, '%'))
            ORDER BY u.nome ASC
            """)
    List<Usuario> buscarPorTermo(String termo);
}
