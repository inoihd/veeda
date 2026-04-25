# Glossário do Veeda

> Nomenclaturas oficiais para falar do produto. Toda comunicação em código (commits, comentários, PRs, docs, copy de UI) deve usá-las.
> Definidas em "Estruturação do projeto Veeda 1.0" (Apr 24, 2026).

---

## Identidade dos atores

### DONO DA VEEDA
> Variações: Usuário A.

Pessoa que está logada na própria conta. Pode criar e publicar **REGISTROS** na sua **LINHA DO TEMPO** via tela **MEU DIA**. É soberano sobre os próprios dados (Art. 5 da Constituição) e tem identidade imutável (Art. 2).

### PESSOA DO MEU CÍRCULO
> Variações: Usuário B, Integrante do Meu Círculo, Amigo.

Outro DONO DA VEEDA (em sua própria conta) que foi **adicionado ao MEU CÍRCULO** do DONO DA VEEDA atual. Pode **visualizar e comentar** os REGISTROS que o DONO DA VEEDA compartilhar com ele — nunca editar.

### MEU CÍRCULO
> Variações: Grupo de amigos.

Conjunto de PESSOAS DO MEU CÍRCULO de um DONO DA VEEDA. Tem **limite de tamanho** definido pelo plano do usuário (Etapa 3): 15 (grátis), 30 (básico), 50 (intermediário), 150 (premium).

---

## Conteúdo

### REGISTRO
> Variações: Acontecimento do dia.

Unidade mínima de conteúdo publicada pelo DONO DA VEEDA. Pode ser: texto, foto, vídeo, áudio, desenho, música, localização, livro (futuro). Vive na **LINHA DO TEMPO** do autor.

### MEU DIA
> Variações: Minha timeline, Dia de hoje.

Tela onde o DONO DA VEEDA cria **REGISTROS** do dia corrente e onde escolhe **compartilhar o dia** com PESSOAS DO MEU CÍRCULO.

### LINHA DO TEMPO
> Sem variação oficial.

"Coluna dorsal" que **agrupa cronologicamente** os REGISTROS de um DONO DA VEEDA. Pode ser visualizada **vertical** (padrão) ou **horizontal** (estilo stories — feature S2.4).

---

## Convenções de uso

- Em **textos da UI** voltados ao usuário, **NUNCA** use os termos técnicos (User A, profile, contact, etc.). Use SEMPRE as nomenclaturas acima.
- Em **código** (comentários, nomes de variável), pode usar termos técnicos quando há colisão com palavras-chave (`profile`, `contacts`), mas deixe claro o mapeamento em comentário no topo do arquivo.
- Em **commits**: prefira "Add comments to REGISTRO" sobre "Add comments to posts". A ferramenta de busca semântica do Claude entende.
- Em **issues do GitHub**: titles começam com `[código]` (ex: `[S2.3]`) e usam nomenclaturas no descritivo.

---

## Termos auxiliares (não-oficiais, mas úteis)

| Termo | Significado |
|-------|-------------|
| Cross-device | Mesma conta acessada de mais de um dispositivo simultaneamente |
| Espelho social | Dados sociais (conexões, dias compartilhados) replicados no Supabase além do localStorage |
| Backup local | Snapshot do perfil em `veeda_backup_<ts>` (Art. 6.3 da Constituição) |
| Splash | Tela inicial (`SplashScreen`) antes de login |

---

## Como adicionar novos termos

Edite este arquivo, mantenha o tom factual, e cite a origem (doc do projeto, decisão arquitetural, conversa com Dhio, etc.). Se a nomenclatura afeta UI ou schema, abra issue com tipo `Doc` no GitHub Project.
