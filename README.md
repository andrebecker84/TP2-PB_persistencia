<div align="center">

[![Instituto Infnet](https://img.shields.io/badge/Instituto-Infnet-red?style=for-the-badge)](https://www.infnet.edu.br)
[![Curso](https://img.shields.io/badge/Curso-Engenharia_de_Software-blue?style=for-the-badge)](https://www.infnet.edu.br)
[![Disciplina](https://img.shields.io/badge/Disciplina-Projeto_de_Bloco:_Eng._Softwares_Escaláveis_(DR5)-green?style=for-the-badge)](https://www.infnet.edu.br)

[![Java](https://img.shields.io/badge/Java-25-orange?logo=openjdk)](https://openjdk.org)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-4.0.6-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Hibernate Envers](https://img.shields.io/badge/Hibernate_Envers-7.2-59666C?logo=hibernate&logoColor=white)](https://hibernate.org/orm/envers/)
[![Flyway](https://img.shields.io/badge/Flyway-11.14-CC0200?logo=flyway&logoColor=white)](https://flywaydb.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Maven](https://img.shields.io/badge/Maven-3.9-C71A36?logo=apachemaven&logoColor=white)](https://maven.apache.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Bruno](https://img.shields.io/badge/API_Tests-Bruno-orange)](https://www.usebruno.com)
[![Testes](https://img.shields.io/badge/Testes-33_passando-success)](#testes-automatizados)
[![Status](https://img.shields.io/badge/Status-Completo-success)](https://github.com/andrebecker84)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

# Infnet Hub — TP2: Camada de Persistência Real

> **Camada de persistência robusta com JPA e Spring Data sobre PostgreSQL, com histórico de dados por snapshot para auditoria e rastreabilidade. Segunda entrega do projeto integrado, evoluindo o monólito do TP1.**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-@becker84-0077B5?logo=linkedin)](https://linkedin.com/in/becker84)
[![GitHub](https://img.shields.io/badge/GitHub-@andrebecker84-181717?logo=github&logoColor=white)](https://github.com/andrebecker84)

</div>

---

## Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [O que mudou desde o TP1](#o-que-mudou-desde-o-tp1)
- [Arquitetura da Persistência](#arquitetura-da-persistência)
- [Histórico de Dados](#histórico-de-dados)
- [Modelo de Dados](#modelo-de-dados)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Como Executar](#como-executar)
- [Testes Automatizados](#testes-automatizados)
- [Testes com Bruno](#testes-com-bruno)
- [API REST](#api-rest)
- [Tecnologias](#tecnologias)
- [Relatório Técnico](#relatório-técnico)
- [Licença](#licença)
- [Créditos](#créditos)

---

## Sobre o Projeto

O **Infnet Hub** é uma plataforma educacional com feed social acadêmico, vagas de carreira, comentários, curtidas e perfis com papéis institucionais (Aluno, Professor, Secretaria, Coordenador).

Esta segunda entrega substitui a persistência ilusória do TP1 — um H2 **em memória** que descartava tudo a cada reinício — por uma **camada de persistência real** sobre PostgreSQL. Além do CRUD, entrega o que o enunciado pede como funcionalidade avançada: **histórico de dados**, capaz de responder não apenas *"como este registro está?"*, mas *"como ele estava em cada ponto do tempo, e quem o alterou?"*.

Persistência real não é só trocar o banco. É garantir que os dados sobrevivam, que o schema evolua de forma versionada, que a integridade seja arbitrada pelo banco e não pela aplicação, que as consultas não degradem com o volume, e que toda mudança deixe rastro.

---

## O que mudou desde o TP1

| Aspecto | TP1 | TP2 |
|---|---|---|
| Banco | H2 **em memória** | **PostgreSQL 18** (Docker), H2 só em testes |
| Schema | `ddl-auto=create-drop` | **Flyway** versionado + `ddl-auto=validate` |
| Perfis | Um só, implícito | **dev · prod · test** |
| Histórico | Inexistente | **Hibernate Envers** — snapshot por revisão |
| Autoria | Inexistente | `@CreatedBy`/`@LastModifiedBy` + autor por revisão |
| Timestamps | `@PrePersist` repetido em cada entidade | `@MappedSuperclass` com Spring Data Auditing |
| Concorrência | Sem controle | **`@Version`** — bloqueio otimista |
| Integridade | Só anotações JPA | Constraints e checks **no banco** |
| Feed | **N+1**: 1 + N consultas | 2 consultas, independente do volume |
| Índices | Nenhum explícito | 12, derivados das consultas reais |
| Testes | 1 | **33** |

---

## Arquitetura da Persistência

```
┌──────────────────────────────────────────────────────────────────┐
│  Front-End (Next.js 15)                        localhost:13000    │
└──────────────────────────────┬───────────────────────────────────┘
                               │ HTTP + header X-Usuario-Id
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  ContextoAuditoriaFilter → resolve o autor → ThreadLocal         │
├──────────────────────────────────────────────────────────────────┤
│  Controller → Service (@Transactional) → Repository              │
│                                                                  │
│    JpaRepository            RevisionRepository                   │
│    (estado atual)           (histórico, spring-data-envers)      │
├──────────────────────────────┬───────────────────────────────────┤
│  Hibernate 7.2 + Envers      │ no commit, grava a revisão        │
└──────────────────────────────┼───────────────────────────────────┘
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  PostgreSQL 18          schema versionado por Flyway             │
│                                                                  │
│  Estado atual                    Auditoria                       │
│  usuarios · posts · vagas        revisao_auditoria (quem/quando) │
│  comentarios · curtidas          usuarios_aud · posts_aud        │
│                                  vagas_aud · comentarios_aud     │
└──────────────────────────────────────────────────────────────────┘
```

**Decisões de design:**

| Decisão | Implementação | Motivo |
|---|---|---|
| PostgreSQL | Docker Compose com volume nomeado | Persistência real; caminho para full-text search, CDC (TP4) e produção (TP5) |
| Schema versionado | Flyway `V1`, `V2` + `ddl-auto=validate` | O Hibernate confere e falha se divergir, em vez de alterar sozinho |
| Histórico por snapshot | Hibernate Envers `@Audited` | Cada revisão guarda a linha inteira; responder "como estava em T" é ler uma linha |
| Autor da mudança | `@RevisionEntity` customizada | O `REVINFO` padrão do Envers registra quando, não **quem** |
| Auditoria seletiva | `Curtida` fora; `posts.curtidas` `@NotAudited` | Audita-se a intenção editorial, não o engajamento |
| Integridade no banco | UK, FK, CHECK, NOT NULL, `@Version` | Validação em código não impede requisições concorrentes |
| `open-in-view=false` | Global | Sessão não sobrevive à web; força LAZY explícito |
| Carga inicial via JPA | `DataLoader`, não SQL | Dados iniciais nascem **com histórico** |

---

## Histórico de Dados

Cada alteração gera uma **revisão** com o snapshot completo da entidade:

```bash
# Altera um post identificando quem está agindo
curl -X PUT http://localhost:18080/api/v1/posts/1 \
  -H "Content-Type: application/json" \
  -H "X-Usuario-Id: 2" \
  -d '{"titulo":"Título corrigido","conteudo":"Conteúdo revisado","autorId":2}'

# Consulta o histórico
curl http://localhost:18080/api/v1/historico/posts/1
```

```jsonc
{
  "conteudo": [
    {
      "revisao": 6,
      "tipo": "CRIACAO",
      "dataHora": "2026-07-16T17:51:47",
      "autor": "sistema",
      "snapshot": { "id": 1, "titulo": "Bem-vindos ao Bloco 5!", "autorNome": "Prof. Carlos Oliveira" }
    },
    {
      "revisao": 26,
      "tipo": "ALTERACAO",
      "dataHora": "2026-07-16T18:04:12",
      "autor": "Prof. Carlos Oliveira <carlos.oliveira@hub.infnet.local>",
      "origem": "192.168.0.10",
      "snapshot": { "id": 1, "titulo": "Título corrigido", "autorNome": "Prof. Carlos Oliveira" }
    }
  ],
  "totalElementos": 2
}
```

A revisão 6 **continua respondendo o título original** mesmo depois da edição. É a essência do histórico por snapshot: nada precisa ser reconstruído a partir de diffs.

O histórico sobrevive até à exclusão — `GET /api/v1/historico/posts/{id}/ultima-revisao` recupera o conteúdo de um post que não existe mais.

**Duas camadas complementares:**

| | Spring Data JPA Auditing | Hibernate Envers |
|---|---|---|
| Onde grava | Colunas da própria linha | Tabelas `_aud` |
| Responde | "Quem mexeu nisto por último?" | "Como estava em cada ponto do tempo?" |

---

## Modelo de Dados

| Entidade | Papel (DDD) | Auditada |
|---|---|---|
| `Usuario` | Aggregate Root — Identidade | ✅ |
| `Post` | Aggregate Root — Feed | ✅ |
| `Vaga` | Aggregate Root — Oportunidades | ✅ |
| `Comentario` | Entidade do agregado `Post` | ✅ |
| `Curtida` | Entidade do agregado `Post` | ❌ |

`Curtida` **não** é auditada por decisão de modelagem: não tem estado mutável — é criada e removida, nunca editada. A própria linha já é o registro do fato, e sua ausência é o registro da remoção. Auditá-la geraria um par de revisões por clique, inflando o histórico com o evento de maior volume e menor valor de rastreabilidade.

Todas herdam de `EntidadeAuditavel`: `criado_em`, `atualizado_em`, `criado_por`, `atualizado_por`, `versao`.

---

## Estrutura do Projeto

```
TP2-PB_persistencia/
├── bruno/                                  # Coleção de testes de API
│   ├── Historico/                          # ← novo no TP2
│   ├── Usuarios/ · Posts/ · Vagas/ · Comentarios/
│   └── environments/local.bru
├── doc/
│   ├── RELATORIO_TP2-PB.md                 # ← relatório técnico consolidado
│   ├── images/card.svg
│   └── screenshots/
├── frontend/                               # Next.js 15 + TypeScript
├── src/main/java/com/andre/monolito_infnethub/
│   ├── auditoria/                          # ← novo: contexto, filtro, revisão, listener
│   ├── config/                             # AuditoriaConfig, CorsConfig, DataLoader
│   ├── controller/                         # + HistoricoController
│   ├── dto/historico/                      # ← novo: RevisaoDTO, *Snapshot, PaginaDTO
│   ├── model/                              # + EntidadeAuditavel (@MappedSuperclass)
│   ├── repository/                         # JpaRepository + RevisionRepository
│   └── service/                            # + HistoricoService
├── src/main/resources/
│   ├── db/migration/                       # ← novo: V1 domínio, V2 auditoria
│   ├── application.properties              # comum + Envers
│   ├── application-dev.properties          # PostgreSQL
│   └── application-prod.properties         # variáveis de ambiente
├── src/test/                               # 33 testes
├── docker-compose.yml                      # postgres + backend + frontend
└── .env.example
```

---

## Como Executar

**Pré-requisitos:** JDK 25, Maven 3.9+, Docker, Node.js 20+

### Com Docker (recomendado)

```bash
docker compose up -d postgres     # PostgreSQL 18 com volume persistente
./mvnw spring-boot:run            # perfil dev é o padrão
```

- API: `http://localhost:18080/api/v1/posts`
- Histórico: `http://localhost:18080/api/v1/historico/revisoes`

### Portas

O TP2 usa um bloco de portas próprio, em vez das usuais 5432/8080/3000 — que são as primeiras a serem disputadas por outros projetos, e as mesmas que o TP1 utiliza (rodar as duas etapas ao mesmo tempo colidiria):

| Serviço | Porta no host | Interna |
|---|---|---|
| PostgreSQL | **15432** | 5432 |
| Back-end | **18080** | 18080 |
| Front-end | **13000** | 3000 |

Nenhuma variável precisa ser exportada — estes já são os padrões. Para trocar, defina `DB_PORT`, `BACKEND_PORT` ou `FRONTEND_PORT` no `.env` (veja `.env.example`).

### Sem Docker, contra um PostgreSQL local

Não há perfil de execução em banco em memória — de propósito: os dois perfis executáveis (`dev` e `prod`) persistem em PostgreSQL, e o H2 existe apenas nos testes, em escopo `test`. Quem já tiver um PostgreSQL instalado aponta a aplicação para ele:

```bash
createdb infnethub                      # uma vez
DB_URL=jdbc:postgresql://localhost:5432/infnethub \
DB_USER=seu_usuario DB_PASS=sua_senha \
./mvnw spring-boot:run
```

O Flyway cria o schema no primeiro start.

### Front-End

```bash
cd frontend && npm install && npm run dev     # http://localhost:13000
```

### Tudo em contêineres

```bash
docker compose up --build
```

### Comprovando que a persistência é real

```bash
docker compose up -d postgres && ./mvnw spring-boot:run   # cria os dados
# Ctrl+C e suba de novo:
./mvnw spring-boot:run
curl http://localhost:18080/api/v1/posts                   # continuam lá
```

---

## Testes Automatizados

```bash
./mvnw test
```

```
Tests run: 7  — Auditoria por snapshot (Hibernate Envers)
Tests run: 5  — Integridade dos dados
Tests run: 6  — PostRepository
Tests run: 4  — CurtidaService — contador e linhas coerentes
Tests run: 5  — HistoricoService
Tests run: 5  — UsuarioService — unicidade de e-mail e busca
Tests run: 1  — Contexto da aplicação
────────────────────────────────────────────────────────
Tests run: 33, Failures: 0, Errors: 0, Skipped: 0
```

| Classe | Demonstra |
|---|---|
| `AuditoriaEnversTest` | Criação gera snapshot completo; **alteração preserva o valor anterior**; exclusão mantém o último estado; autor e origem registrados |
| `IntegridadeDadosTest` | E-mail e curtida duplicados rejeitados; campos obrigatórios; `versao` incrementa |
| `PostRepositoryTest` | Autor na mesma consulta; ordenação; **contagem agregada** (correção do N+1); paginação |
| `CurtidaServiceTest` | **Contador fiel às linhas** após curtir/descurtir; curtir não gera revisão do post |
| `HistoricoServiceTest` | Linha do tempo com snapshots; **recupera post já excluído**; 404; revisão específica |
| `UsuarioServiceTest` | E-mail duplicado vira **409 de domínio**, não 500; busca e filtro por papel |
| `Tp2PbPersistenciaApplicationTests` | Contexto sobe inteiro |

Os testes de auditoria rodam **sem transação de teste** (`NOT_SUPPORTED`): o Envers grava as revisões no commit, e o rollback automático do `@DataJpaTest` faria as tabelas `_aud` nunca receberem nada — os testes passariam verificando o vazio.

---

## Testes com Bruno

1. Instale o **Bruno** em [usebruno.com](https://www.usebruno.com)
2. Abra o Bruno → **Open Collection** → selecione a pasta `bruno/`
3. Selecione o environment **local**
4. Para ver o histórico funcionando, na pasta **Historico**: execute `Alterar Post (com autor)` e depois `Historico de um Post`

---

## API REST

**Base URL:** `http://localhost:18080`

### Histórico — novo no TP2

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/v1/historico/usuarios/{id}` | Revisões de um usuário, com snapshot |
| `GET` | `/api/v1/historico/posts/{id}` | Revisões de um post |
| `GET` | `/api/v1/historico/vagas/{id}` | Revisões de uma vaga |
| `GET` | `/api/v1/historico/comentarios/{id}` | Revisões de um comentário |
| `GET` | `/api/v1/historico/{entidade}/{id}/revisoes/{rev}` | Snapshot de uma revisão específica |
| `GET` | `/api/v1/historico/posts/{id}/ultima-revisao` | Último estado, mesmo se excluído |
| `GET` | `/api/v1/historico/revisoes` | Linha do tempo global (`?autor=` filtra) |

Paginação em `?pagina=0&tamanho=20`. Apenas GET, de propósito: o histórico é escrito pelo Envers como efeito das operações do domínio — um endpoint capaz de alterá-lo destruiria a garantia que o torna confiável.

Escritas aceitam o header **`X-Usuario-Id`** para identificar o autor da mudança.

### Usuários

| Método | Endpoint | Descrição | Status |
|---|---|---|---|
| `GET` | `/api/v1/usuarios` | Lista todos (`?papel=ALUNO` filtra) | 200 |
| `GET` | `/api/v1/usuarios/buscar?termo=` | Busca por nome ou e-mail | 200 |
| `GET` | `/api/v1/usuarios/{id}` | Busca por ID | 200 / 404 |
| `POST` | `/api/v1/usuarios` | Cria | 201 / **409** |
| `PUT` | `/api/v1/usuarios/{id}` | Atualiza | 200 / 404 / **409** |
| `DELETE` | `/api/v1/usuarios/{id}` | Remove | 204 / 404 / **409** |

O **409 Conflict** cobre e-mail já cadastrado e remoção de usuário ainda referenciado por posts ou comentários. No TP1 esses casos estouravam como 500.

### Posts

| Método | Endpoint | Descrição | Status |
|---|---|---|---|
| `GET` | `/api/v1/posts` | Feed completo (`?autorId=` filtra) | 200 |
| `GET` | `/api/v1/posts/paginado?pagina=&tamanho=` | Feed paginado | 200 |
| `GET` | `/api/v1/posts/{id}` | Busca por ID | 200 / 404 |
| `POST` | `/api/v1/posts` | Cria | 201 |
| `PUT` | `/api/v1/posts/{id}` | Atualiza | 200 / 404 |
| `DELETE` | `/api/v1/posts/{id}` | Remove | 204 / 404 |

### Curtidas

| Método | Endpoint | Descrição | Status |
|---|---|---|---|
| `GET` | `/api/v1/posts/{postId}/curtidas` | Lista quem curtiu | 200 |
| `POST` | `/api/v1/posts/{postId}/curtidas?usuarioId={id}` | Curtir / descurtir | 200 / 404 |

> O endpoint `POST /posts/{id}/curtir` do TP1 foi **removido**: sem `usuarioId` ele não conseguia criar a linha em `curtidas`, apenas incrementava o contador — inconsistente por construção. O toggle acima é o mecanismo completo, e mantém contador e linhas sincronizados na mesma transação.

### Comentários

| Método | Endpoint | Descrição | Status |
|---|---|---|---|
| `GET` | `/api/v1/posts/{postId}/comentarios` | Lista de um post | 200 |
| `POST` | `/api/v1/posts/{postId}/comentarios` | Adiciona | 201 |
| `PUT` | `/api/v1/posts/{postId}/comentarios/{id}` | Edita | 200 / 404 |
| `DELETE` | `/api/v1/posts/{postId}/comentarios/{id}` | Remove | 204 / 404 |

### Vagas

| Método | Endpoint | Descrição | Status |
|---|---|---|---|
| `GET` | `/api/v1/vagas` | Lista as ativas | 200 |
| `GET` | `/api/v1/vagas/paginado?pagina=&tamanho=` | Ativas, paginado | 200 |
| `GET` | `/api/v1/vagas/{id}` | Busca por ID | 200 / 404 |
| `GET` | `/api/v1/vagas/tipo/{tipo}` | Filtra por tipo | 200 |
| `POST` | `/api/v1/vagas` | Cria | 201 |
| `PUT` | `/api/v1/vagas/{id}` | Atualiza | 200 / 404 |
| `DELETE` | `/api/v1/vagas/{id}` | Remove | 204 / 404 |

Os endpoints do TP1 mantêm o mesmo contrato — o front-end continua funcionando sem alteração.

---

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Linguagem | Java 25 (Eclipse Temurin) |
| Framework | Spring Boot 4.0.6 |
| ORM | Spring Data JPA + Hibernate 7.2.12 |
| Banco (dev/prod) | PostgreSQL 18 |
| Banco (testes) | H2 2.4 em memória |
| Histórico | Hibernate Envers + Spring Data Envers 4.0.5 |
| Migrations | Flyway 11.14 |
| Validação | Spring Validation (Jakarta Bean Validation) |
| Boilerplate | Lombok |
| Front-End | Next.js 15 + TypeScript + React 19 |
| Estilização | CSS Modules |
| Testes | JUnit 5 + AssertJ + `@DataJpaTest` + `@SpringBootTest` |
| Testes de API | Bruno |
| Containerização | Docker + Docker Compose |
| Build | Maven 3.9 |

---

## Relatório Técnico

A documentação completa está consolidada em um único relatório, [`doc/RELATORIO_TP2-PB.md`](doc/RELATORIO_TP2-PB.md), organizado em três partes: as **fundações da aplicação** (arquitetura, DDD, SOLID, design patterns, front-end), a **camada de persistência** — o foco desta entrega, com design, modelo de dados, **exemplos de uso dos repositórios**, estratégia de auditoria, integridade, performance e testes — e a **operação** (API, execução, dependências e entrega).

---

## Licença

Distribuído sob a licença MIT. Veja [LICENSE](LICENSE) para mais informações.

---

## Créditos

| Asset | Autor | Licença |
|---|---|---|
| Foto da página de login | [Meredith Spencer](https://unsplash.com/@meredithspencer) no Unsplash | [Unsplash License](https://unsplash.com/license) — uso gratuito |

Foto: *"Um grupo de pessoas andando em uma calçada"* —
https://unsplash.com/pt-br/fotografias/um-grupo-de-pessoas-andando-em-uma-calcada-QfE2FAW_oPI

---

<div align="center">

<p><strong>Desenvolvido como Trabalho Prático da disciplina de Engenharia de Softwares Escaláveis.</strong></p>

<p>
  <a href="https://www.java.com/"><img src="https://img.shields.io/badge/Made%20with-Java_25-orange?logo=openjdk" alt="Java 25"></a>
  <a href="https://maven.apache.org/"><img src="https://img.shields.io/badge/Built%20with-Maven-C71A36?logo=apachemaven&logoColor=white" alt="Maven"></a>
  <a href="https://spring.io/projects/spring-boot"><img src="https://img.shields.io/badge/Powered%20by-Spring_Boot-6DB33F?logo=springboot&logoColor=white" alt="Spring Boot"></a>
  <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/Data-PostgreSQL_18-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL 18"></a>
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Front--End-Next.js_15-000000?logo=nextdotjs&logoColor=white" alt="Next.js 15"></a>
</p>

<a href="doc/images/card.svg">
  <img src="doc/images/card.svg" width="360" alt="André Becker - Software Engineer">
</a>

<p><em>Instituto Infnet — Engenharia de Software — 2026.</em></p>

</div>
