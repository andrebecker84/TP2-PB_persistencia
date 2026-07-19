package com.andre.monolito_infnethub.model;

/** Bounded Context: Identidade — papel do usuário na plataforma */
public enum Papel {
    ALUNO("Aluno(a)"),
    PROFESSOR("Professor(a)"),
    SECRETARIA("Secretaria"),
    COORDENADOR("Coordenador(a)");

    private final String descricao;

    Papel(String descricao) { this.descricao = descricao; }

    public String getDescricao() { return descricao; }
}
