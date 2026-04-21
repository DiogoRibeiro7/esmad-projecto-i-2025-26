# Aula 1 — Boas práticas no GitHub

Esta aula é sobre processo, não sobre uma stack técnica. Em vez de código para correr, tens aqui exercícios guiados para praticar commits, branches, Pull Requests e revisão num repositório real.

## Objectivos

No fim da aula deves ser capaz de:

- Organizar um repositório com `README`, `.gitignore` e estrutura clara.
- Fazer commits pequenos, com mensagens úteis.
- Usar branches para isolar tarefas.
- Abrir uma Pull Request com contexto suficiente para revisão.
- Ler o estado do repositório com `git status`, `git diff` e `git log` antes de agir.

## Pré-requisitos

- `git` instalado: `git --version`
- Conta GitHub com chave SSH configurada (ou usa HTTPS com token)
- Identidade Git configurada:
  ```bash
  git config --global user.name "O Teu Nome"
  git config --global user.email "email@exemplo.com"
  ```

---

## Exercício 1 — Criar um repositório do zero

```bash
mkdir meu-projeto-aula-1
cd meu-projeto-aula-1
git init

echo "# Meu Projeto" > README.md
git add README.md
git commit -m "Add initial README"
```

**Critério de sucesso:** `git log --oneline` mostra um commit.

---

## Exercício 2 — Estrutura mínima

Cria esta estrutura:

```
meu-projeto-aula-1/
├── README.md
├── .gitignore
├── src/
│   └── main.py
├── tests/
└── docs/
```

Conteúdo mínimo para `.gitignore`:

```
__pycache__/
*.pyc
.env
.venv/
node_modules/
dist/
build/
.DS_Store
.vscode/
```

Conteúdo mínimo para `src/main.py`:

```python
def greet(name: str) -> str:
    return f"Hello, {name}"

if __name__ == "__main__":
    print(greet("world"))
```

Commita em **dois** commits separados: um para a estrutura/.gitignore, outro para o código Python.

```bash
git add .gitignore src/ tests/ docs/
git commit -m "Add project structure and gitignore"

git add src/main.py
git commit -m "Add greet function"
```

**Critério de sucesso:** `git log --oneline` mostra três commits com mensagens no imperativo.

---

## Exercício 3 — Ligar a um repositório remoto

1. No GitHub, cria um repositório vazio chamado `meu-projeto-aula-1` (sem README, sem `.gitignore`).
2. Liga o local ao remoto:
   ```bash
   git remote add origin <URL_DO_REPO>
   git branch -M main
   git push -u origin main
   ```

**Critério de sucesso:** vês os três commits no GitHub.

---

## Exercício 4 — Branch de funcionalidade

Vais adicionar validação à função `greet`.

```bash
git switch -c feature/greet-validation
```

Altera `src/main.py` para rejeitar nomes vazios:

```python
def greet(name: str) -> str:
    if not name or not name.strip():
        raise ValueError("name is required")
    return f"Hello, {name}"

if __name__ == "__main__":
    print(greet("world"))
```

Antes de commitar, observa o estado:

```bash
git status
git diff
```

Commita e envia a branch:

```bash
git add src/main.py
git commit -m "Add validation to greet function"
git push -u origin feature/greet-validation
```

**Critério de sucesso:** a branch aparece no GitHub com um commit à frente de `main`.

---

## Exercício 5 — Abrir uma Pull Request

No GitHub, abre uma PR de `feature/greet-validation` para `main`. Usa a seguinte estrutura na descrição:

```
O que muda:
Adiciona validacao a funcao greet para rejeitar nomes vazios.

Porque:
Evita que a aplicacao devolva "Hello, " sem nome.

Como testar:
1) python src/main.py           # deve imprimir Hello, world
2) abrir REPL e chamar greet("")
3) confirmar ValueError com mensagem "name is required"
```

**Critério de sucesso:** a PR está aberta com título claro (por exemplo, `Add validation to greet function`) e com a descrição acima.

---

## Exercício 6 — Revisão cruzada

Em pares. Cada um revê a PR do outro e deixa pelo menos um comentário útil. Usa a tabela abaixo como referência de tom:

| Útil | Fraco |
|------|-------|
| "Talvez faça sentido aceitar também espaços à volta do nome — `strip()` já trata disso, mas podemos documentar." | "Isto está mal." |
| "O `ValueError` está bom, mas a mensagem podia dizer `name must be non-empty`." | "Não gosto disto." |
| "Falta um teste para o caso `None`." | "Falta qualquer coisa." |

Depois de pelo menos um comentário respondido ou resolvido, faz merge.

**Critério de sucesso:** a PR está merged e a `main` no GitHub contém o commit da funcionalidade.

---

## Exercício 7 — Simular um conflito

Cria duas branches a partir de `main`:

```bash
git switch main
git pull
git switch -c fix/readme-a
# editar README.md — mudar o título para "# Projeto A"
git add README.md
git commit -m "Update title in README"
git push -u origin fix/readme-a

git switch main
git switch -c fix/readme-b
# editar README.md — mudar o título para "# Projeto B"
git add README.md
git commit -m "Rename project in README"
git push -u origin fix/readme-b
```

Abre PR para `fix/readme-a`, faz merge. Depois volta a `fix/readme-b`:

```bash
git switch fix/readme-b
git merge main
```

Vais ter conflito. Abre `README.md`, resolve manualmente (escolhe o título final correcto), depois:

```bash
git add README.md
git commit -m "Resolve merge conflict in README"
```

**Critério de sucesso:** conflito resolvido sem perder alterações úteis; `git log --oneline --graph` mostra o merge.

---

## Exercício 8 — Desfazer com controlo

Pratica estas três operações:

```bash
# 1) retirar um ficheiro do staging (mantém alterações)
echo "xxx" >> README.md
git add README.md
git restore --staged README.md

# 2) desfazer alterações locais num ficheiro (destrutivo)
git restore README.md

# 3) inspeccionar um commit
git log --oneline
git show <HASH_DO_COMMIT>
```

**Critério de sucesso:** consegues explicar, em voz alta, a diferença entre `restore --staged` e `restore`.

---

## Checklist final

- [ ] Repositório no GitHub com `README.md`, `.gitignore` e estrutura mínima
- [ ] Pelo menos 6 commits, todos com mensagens no imperativo
- [ ] Pelo menos 1 PR merged com descrição no formato "o que / porque / como testar"
- [ ] Pelo menos 1 conflito de merge resolvido manualmente
- [ ] Pelo menos 1 comentário de revisão útil dado a um colega

## Referência rápida

| Comando | Uso |
|---------|-----|
| `git status` | Ver estado actual |
| `git diff` | Ver alterações ainda não commitadas |
| `git add <ficheiro>` | Pôr ficheiro em staging |
| `git commit -m "..."` | Criar commit |
| `git switch -c <branch>` | Criar branch e mudar para ela |
| `git push -u origin <branch>` | Enviar branch para o remoto |
| `git pull` | Actualizar a branch actual |
| `git log --oneline --graph` | Histórico resumido |
| `git show <hash>` | Conteúdo de um commit |
| `git restore <ficheiro>` | Desfaz alterações locais |
| `git restore --staged <ficheiro>` | Tira ficheiro do staging |
| `git merge <branch>` | Integra branch na actual |
