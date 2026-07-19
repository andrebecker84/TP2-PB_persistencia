package com.andre.monolito_infnethub.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(corpo(404, "Recurso não encontrado", ex.getMessage()));
    }

    @ExceptionHandler(ConflitoDeDadosException.class)
    public ResponseEntity<Map<String, Object>> handleConflito(ConflitoDeDadosException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(corpo(409, "Conflito com os dados existentes", ex.getMessage()));
    }

    /**
     * Rede de segurança para as constraints do banco.
     *
     * <p>Os serviços checam antes de gravar, mas a checagem não é atômica: duas
     * requisições simultâneas passam juntas pela verificação e só a constraint
     * as separa. Quem perde a corrida chega aqui — e sem este tratamento levaria
     * um 500, transformando uma regra de negócio funcionando em erro de servidor.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleIntegridade(DataIntegrityViolationException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(corpo(409,
                "Conflito com os dados existentes",
                traduzir(ex)));
    }

    /**
     * Perda de corrida no bloqueio otimista ({@code @Version}).
     *
     * <p>Outra transação gravou por cima entre a leitura e a escrita. Não é falha
     * do servidor: é a proteção contra atualização perdida funcionando. O cliente
     * deve reler e tentar de novo.
     */
    @ExceptionHandler(OptimisticLockingFailureException.class)
    public ResponseEntity<Map<String, Object>> handleConcorrencia(OptimisticLockingFailureException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(corpo(409,
                "Conflito de concorrência",
                "O registro foi alterado por outra operação enquanto esta era processada. Recarregue os dados e tente novamente."));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> campos = new LinkedHashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            campos.put(error.getField(), error.getDefaultMessage());
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", 400);
        body.put("error", "Dados inválidos");
        body.put("campos", campos);

        return ResponseEntity.badRequest().body(body);
    }

    /**
     * Converte a violação de constraint em uma mensagem de domínio.
     *
     * <p>A mensagem crua do banco expõe nomes de tabela e de constraint — ruído
     * para o cliente e informação a mais para quem estiver sondando a API.
     */
    private String traduzir(DataIntegrityViolationException ex) {
        String causa = ex.getMostSpecificCause().getMessage();
        if (causa == null) {
            return "A operação viola uma restrição de integridade dos dados.";
        }
        String normalizado = causa.toLowerCase();
        if (normalizado.contains("uk_usuarios_email")) {
            return "Já existe um usuário cadastrado com este e-mail.";
        }
        if (normalizado.contains("uk_curtidas_post_usuario")) {
            return "Este usuário já curtiu esta publicação.";
        }
        if (normalizado.contains("fk_")) {
            return "O registro não pode ser removido ou alterado porque está referenciado por outros dados.";
        }
        return "A operação viola uma restrição de integridade dos dados.";
    }

    private Map<String, Object> corpo(int status, String erro, String mensagem) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", status);
        body.put("error", erro);
        body.put("message", mensagem);
        return body;
    }
}
