package com.andre.monolito_infnethub.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.envers.Audited;

/** Aggregate Root — Bounded Context: Identidade */
@Entity
@Table(
        name = "usuarios",
        indexes = {
                @Index(name = "idx_usuarios_papel", columnList = "papel")
        }
)
@Audited
@Data
@EqualsAndHashCode(callSuper = false)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Usuario extends EntidadeAuditavel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nome;

    /** Identidade institucional — a unicidade é garantida no banco. */
    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(length = 100)
    private String escola;

    @Column(name = "ultimo_bloco", length = 50)
    private String ultimoBloco;

    @Column(length = 20)
    private String classe;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Papel papel = Papel.ALUNO;
}
