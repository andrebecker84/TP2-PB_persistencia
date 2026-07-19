package com.andre.monolito_infnethub.config;

import com.andre.monolito_infnethub.auditoria.ContextoAuditoria;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.envers.repository.config.EnableEnversRepositories;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

import java.util.Optional;

/**
 * Habilita as duas camadas de auditoria, que respondem a perguntas diferentes:
 *
 * <ul>
 *   <li><b>Spring Data JPA Auditing</b> — carimba criado/atualizado em cada
 *       linha viva. Responde "quem mexeu nisto por último?" com um SELECT
 *       simples, sem tocar no histórico.</li>
 *   <li><b>Spring Data Envers</b> — troca a implementação padrão dos
 *       repositórios por uma que também sabe ler as tabelas {@code _aud}.
 *       Responde "como este registro estava em cada ponto do tempo?".</li>
 * </ul>
 */
@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorAware")
@EnableEnversRepositories(basePackages = "com.andre.monolito_infnethub.repository")
public class AuditoriaConfig {

    /**
     * Fonte de {@code @CreatedBy} / {@code @LastModifiedBy}.
     *
     * <p>Nunca devolve {@code Optional.empty()}: as colunas de autoria são
     * {@code NOT NULL} e uma escrita fora de requisição HTTP (a carga inicial,
     * por exemplo) é atribuída ao sistema em vez de ficar sem responsável.
     */
    @Bean
    public AuditorAware<String> auditorAware() {
        return () -> Optional.of(ContextoAuditoria.autorAtual());
    }
}
