package com.andre.monolito_infnethub.config;

import com.andre.monolito_infnethub.model.*;
import com.andre.monolito_infnethub.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Carga de demonstração.
 *
 * <p>Grava pelos repositórios, e não por SQL de migration, para que os dados
 * iniciais nasçam com histórico: cada registro criado aqui gera sua revisão de
 * criação no Envers, atribuída ao autor {@code sistema} — não há requisição HTTP
 * no start da aplicação. Sem isso, o histórico dos registros semeados começaria
 * vazio e a auditoria teria um ponto cego bem no dado mais visível da aplicação.
 *
 * <p>Restrito ao perfil dev: em produção a base não é semeada, e nos testes cada
 * classe monta os próprios dados. Reexecutar é seguro, pois a carga só ocorre
 * com a base vazia.
 */
@Component
@Profile("dev")
@RequiredArgsConstructor
public class DataLoader implements ApplicationRunner {

    private final UsuarioRepository    usuarioRepository;
    private final PostRepository       postRepository;
    private final VagaRepository       vagaRepository;
    private final CurtidaRepository    curtidaRepository;
    private final ComentarioRepository comentarioRepository;

    @Override
    public void run(ApplicationArguments args) {
        if (usuarioRepository.count() > 0) return;

        // ── Usuários ───────────────────────────────────────────────
        Usuario lucas = usuarioRepository.save(Usuario.builder()
                .nome("Lucas Mendonça").email("lucas.mendonca@hub.infnet.local")
                .escola("Faculdade Infnet").ultimoBloco("Bloco 5").classe("26E2")
                .papel(Papel.ALUNO).build());

        Usuario carlos = usuarioRepository.save(Usuario.builder()
                .nome("Prof. Carlos Oliveira").email("carlos.oliveira@hub.infnet.local")
                .escola("Faculdade Infnet").ultimoBloco("Professor")
                .papel(Papel.PROFESSOR).build());

        Usuario secretaria = usuarioRepository.save(Usuario.builder()
                .nome("Atendimento Infnet Hub").email("atendimento@hub.infnet.local")
                .escola("Faculdade Infnet")
                .papel(Papel.SECRETARIA).build());

        Usuario mariana = usuarioRepository.save(Usuario.builder()
                .nome("Mariana Ferreira").email("mariana.ferreira@hub.infnet.local")
                .escola("Faculdade Infnet").ultimoBloco("Bloco 5").classe("26E2")
                .papel(Papel.ALUNO).build());

        Usuario rafael = usuarioRepository.save(Usuario.builder()
                .nome("Rafael Azevedo").email("rafael.azevedo@hub.infnet.local")
                .escola("Faculdade Infnet").ultimoBloco("Bloco 5").classe("26E1")
                .papel(Papel.ALUNO).build());

        // ── Posts ──────────────────────────────────────────────────
        Post p1 = postRepository.save(Post.builder()
                .titulo("Bem-vindos ao Bloco 5!")
                .conteudo("Olá turma! Começamos mais um bloco com muitos desafios pela frente. Este semestre vamos explorar microsserviços, eventos assíncronos e muito mais. Preparem-se!")
                .autor(carlos).curtidas(0).build());

        Post p2 = postRepository.save(Post.builder()
                .conteudo("Alguém já começou o TP2? Subi o PostgreSQL pelo Docker Compose, mas a aplicação não sobe: o Hibernate reclama que a tabela `comentarios` não existe. As migrations do Flyway não parecem estar rodando.")
                .autor(lucas).curtidas(0).build());

        Post p3 = postRepository.save(Post.builder()
                .titulo("Participe do Colegiado e faça a diferença!")
                .conteudo("Essa é a sua chance de contribuir diretamente para melhorias no curso e representar seus colegas. A participação na reunião do Colegiado garante 1 hora de Atividades Complementares. Serão selecionados até dois alunos por curso.")
                .autor(secretaria).curtidas(0).build());

        Post p4 = postRepository.save(Post.builder()
                .conteudo("Dica para quem travou no TP2: no Spring Boot 4 o `flyway-core` sozinho não roda as migrations — ele entra no classpath, mas nada o liga ao ciclo de vida da aplicação. Falta a dependência `org.springframework.boot:spring-boot-flyway`. As autoconfigurações foram divididas em módulos e a maioria dos tutoriais ainda não cobre isso.")
                .autor(carlos).curtidas(0).build());

        Post p5 = postRepository.save(Post.builder()
                .titulo("Aula ao vivo — Arquitetura de Microsserviços")
                .conteudo("Na aula de hoje vamos decompor o monolito em microsserviços independentes usando Spring Cloud Gateway e Eureka para service discovery. Confirme presença no link da aula!")
                .autor(carlos).curtidas(0).build());

        // ── Curtidas ───────────────────────────────────────────────
        curtir(p1, List.of(lucas, mariana, rafael));
        curtir(p2, List.of(carlos, mariana, rafael));
        curtir(p3, List.of(lucas, carlos, mariana, rafael));
        curtir(p4, List.of(lucas, mariana, rafael));
        curtir(p5, List.of(lucas, mariana, rafael));

        // ── Comentários ────────────────────────────────────────────
        comentarioRepository.save(Comentario.builder()
                .conteudo("Animado para esse bloco! Vamos nessa!")
                .post(p1).autor(lucas).build());
        comentarioRepository.save(Comentario.builder()
                .conteudo("Que início empolgante! Mal posso esperar pelas aulas práticas de microsserviços.")
                .post(p1).autor(mariana).build());

        comentarioRepository.save(Comentario.builder()
                .conteudo("Confira o log do start: se não aparecer nenhuma linha do Flyway, ele nem chegou a rodar. Com `ddl-auto=validate` o Hibernate só confere o schema — ele não cria tabela nenhuma, e é por isso que a falha aparece como tabela inexistente.")
                .post(p2).autor(carlos).build());
        comentarioRepository.save(Comentario.builder()
                .conteudo("Tive o mesmo problema! No meu caso o banco também estava na porta errada: a 5432 já estava ocupada por outro projeto e eu não tinha percebido. A variável DB_PORT resolve.")
                .post(p2).autor(mariana).build());
        comentarioRepository.save(Comentario.builder()
                .conteudo("Valeu pessoal! Consegui resolver seguindo essas dicas.")
                .post(p2).autor(lucas).build());

        comentarioRepository.save(Comentario.builder()
                .conteudo("Funcionou aqui! Muito obrigado, prof. Era exatamente isso.")
                .post(p4).autor(lucas).build());
        comentarioRepository.save(Comentario.builder()
                .conteudo("Salvou demais! Estava quebrando a cabeça com esse erro há horas.")
                .post(p4).autor(rafael).build());
        comentarioRepository.save(Comentario.builder()
                .conteudo("Dica de ouro! Vou adicionar isso no meu setup padrão de todo projeto Spring Boot.")
                .post(p4).autor(mariana).build());

        comentarioRepository.save(Comentario.builder()
                .conteudo("Já confirmei presença! Muito animado com esse tema — era exatamente o que precisava para o TP3.")
                .post(p5).autor(rafael).build());
        comentarioRepository.save(Comentario.builder()
                .conteudo("Microsserviços com Spring Cloud Gateway é exatamente o que estava esperando. Vejo vocês na aula!")
                .post(p5).autor(mariana).build());

        // ── Vagas ──────────────────────────────────────────────────
        vagaRepository.save(Vaga.builder()
                .titulo("Desenvolvedor Java Backend").empresa("TechSolutions Brasil")
                .descricao("Desenvolvimento de APIs REST com Spring Boot, JPA e PostgreSQL. Experiência com Docker e CI/CD é diferencial.")
                .localizacao("São Paulo, SP").tipo(TipoVaga.CLT).categoria("Backend")
                .criador(secretaria).build());

        vagaRepository.save(Vaga.builder()
                .titulo("Estágio em Desenvolvimento React").empresa("Startup Digital Rio")
                .descricao("Desenvolvimento de interfaces web com React e TypeScript. Ideal para estudantes de Engenharia de Software.")
                .localizacao("Rio de Janeiro, RJ (Híbrido)").tipo(TipoVaga.ESTAGIO).categoria("Frontend")
                .criador(secretaria).build());

        vagaRepository.save(Vaga.builder()
                .titulo("Desenvolvedor Full Stack").empresa("Fintech Carioca")
                .descricao("Stack: Node.js + React + PostgreSQL. Atuação em produto financeiro de alto crescimento. 100% remoto.")
                .localizacao("Remoto").tipo(TipoVaga.PJ).categoria("Full Stack")
                .criador(secretaria).build());

        vagaRepository.save(Vaga.builder()
                .titulo("Mobile Developer React Native").empresa("AppWorks Solutions")
                .descricao("Desenvolvimento de aplicativos iOS e Android com React Native. Publicação nas lojas e integração com APIs REST.")
                .localizacao("São Paulo, SP").tipo(TipoVaga.CLT).categoria("Mobile")
                .criador(secretaria).build());

        vagaRepository.save(Vaga.builder()
                .titulo("Trainee Engenharia de Software").empresa("Banco Digital BR")
                .descricao("Programa trainee de 18 meses com rotação em times de backend, infraestrutura e dados. Formação técnica intensiva.")
                .localizacao("São Paulo, SP").tipo(TipoVaga.TRAINEE).categoria("Trainee")
                .criador(secretaria).build());
    }

    private void curtir(Post post, List<Usuario> usuarios) {
        usuarios.forEach(u ->
            curtidaRepository.save(Curtida.builder().post(post).usuario(u).build())
        );
        post.setCurtidas(usuarios.size());
        postRepository.save(post);
    }
}
