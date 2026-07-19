package com.andre.monolito_infnethub.auditoria;

import com.andre.monolito_infnethub.repository.UsuarioRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

/**
 * Identifica o autor da requisição e o publica no {@link ContextoAuditoria}.
 *
 * <p>O TP1 não tem autenticação, então o cliente informa quem está agindo pelo
 * cabeçalho {@code X-Usuario-Id}. Quando o TP5 introduzir autenticação de fato,
 * basta trocar {@link #resolverAutor} pela identidade do usuário autenticado —
 * o restante da cadeia de auditoria não muda.
 *
 * <p>A consulta ao usuário só acontece em métodos de escrita: são os únicos que
 * geram revisão no Envers, e assim nenhuma leitura paga uma consulta a mais.
 */
@Component
@RequiredArgsConstructor
public class ContextoAuditoriaFilter extends OncePerRequestFilter {

    private static final String HEADER_USUARIO = "X-Usuario-Id";
    private static final Set<String> METODOS_DE_ESCRITA = Set.of("POST", "PUT", "PATCH", "DELETE");

    private final UsuarioRepository usuarioRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            if (METODOS_DE_ESCRITA.contains(request.getMethod())) {
                ContextoAuditoria.definirAutor(resolverAutor(request));
                ContextoAuditoria.definirOrigem(request.getRemoteAddr());
            }
            filterChain.doFilter(request, response);
        } finally {
            // Obrigatório: a thread volta para o pool e atenderia a próxima
            // requisição carregando o autor da anterior.
            ContextoAuditoria.limpar();
        }
    }

    private String resolverAutor(HttpServletRequest request) {
        String header = request.getHeader(HEADER_USUARIO);
        if (header == null || header.isBlank()) {
            return ContextoAuditoria.AUTOR_ANONIMO;
        }
        try {
            Long usuarioId = Long.valueOf(header.trim());
            return usuarioRepository.findById(usuarioId)
                    .map(usuario -> "%s <%s>".formatted(usuario.getNome(), usuario.getEmail()))
                    .orElse("usuario:%d (não encontrado)".formatted(usuarioId));
        } catch (NumberFormatException e) {
            return "usuario:%s (identificador inválido)".formatted(header.trim());
        }
    }
}
