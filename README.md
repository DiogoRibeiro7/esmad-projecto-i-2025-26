# Projecto I — Material das aulas práticas

Código, exercícios e guias passo-a-passo das três aulas práticas de Projecto I.

Cada aula vive na sua pasta e é independente das restantes — podes abrir só uma e correr-a sem tocar nas outras.

## Índice

| # | Aula | Conteúdo |
|---|------|----------|
| 1 | [Boas práticas no GitHub](aula-1-git/README.md) | Repositório, commits, branches, Pull Requests, revisão de código |
| 2 | [Persistência de dados](aula-2-persistencia/README.md) | `localStorage` no cliente, MongoDB no servidor, CRUD com Express + TypeScript |
| 3 | [Integração de APIs externas](aula-3-apis-externas/README.md) | Padrão UI → Gateway → API externa, Quiz API, anexo com Google Maps |

## Pré-requisitos gerais

Para as aulas 2 e 3:

- [Node.js](https://nodejs.org/) 20 ou superior (inclui `npm`)
- Um editor de código (VS Code é suficiente)
- Um cliente HTTP para testes rápidos — `curl` é o usado nos exemplos
- Para a aula 2, [Docker](https://www.docker.com/) ou MongoDB local (ver README da aula)

Para a aula 1:

- `git` instalado e configurado (`git config --global user.name` e `user.email`)
- Conta GitHub

## Como abrir cada aula

Cada aula tem um `README.md` com os passos completos. O caminho típico é:

```bash
cd aula-2-persistencia
# ler README, seguir os passos
```

## Estrutura

```
.
├── README.md                    # este ficheiro
├── .gitignore
├── aula-1-git/                  # só documentação e exercícios
├── aula-2-persistencia/         # backend + frontend
└── aula-3-apis-externas/        # backend + frontend
```

## Licença

Material didáctico para uso em aula. Usa, altera e adapta à vontade.
