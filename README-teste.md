# Teste de DevOps - CI/CD, Deploy no Kubernetes e Observabilidade

## Objetivo

O objetivo deste teste é avaliar a capacidade do candidato em configurar uma esteira de CI/CD para a aplicação [api-node](https://github.com/tiagohique/api-node). A esteira deve realizar o deploy automatizado em um cluster Kubernetes, configurar um Horizontal Pod Autoscaler (HPA) para escalabilidade dinâmica e implementar observabilidade para monitoramento da aplicação.

## Requisitos do Teste

1. **Configuração do CI/CD**:
   - Utilize uma ferramenta de CI/CD como GitHub Actions, GitLab CI, Jenkins, ArgoCD ou outra de sua escolha.
   - O pipeline deve ser acionado a cada push na branch `main`.
   - O pipeline deve:
     - Construir a imagem Docker da aplicação.
     - Publicar a imagem no Docker Hub ou em outro registro de imagens (ECR, GCR, ACR, etc.).
     - Implantar a aplicação em um cluster Kubernetes.

2. **Configuração do Kubernetes**:
   - Criar os manifests Kubernetes necessários:
     - **Deployment** com pelo menos 2 réplicas iniciais.
     - **Service** do tipo LoadBalancer ou NodePort para exposição da aplicação.
     - **ConfigMap/Secret** caso necessário para armazenar configurações.
     - **HPA (Horizontal Pod Autoscaler)** configurado para escalar de **2 até 10 pods**, baseado no consumo de CPU (métrica recomendada: 70% de uso da CPU por pod).

3. **Configuração de Observabilidade**:
   - Implementar uma solução de monitoramento para a aplicação, utilizando ferramentas como Prometheus, Grafana, Datadog, New Relic ou outra equivalente.
   - Criar dashboards básicos para exibir métricas de uso de CPU, memória e quantidade de pods em execução.
   - Configurar logs centralizados utilizando uma stack de observabilidade como EFK (Elasticsearch, Fluentd, Kibana) ou Loki + Grafana.
   - Configurar alertas para detecção de falhas, por exemplo:
     - Uso de CPU acima de 80% por um período contínuo de 5 minutos.
     - Número de pods abaixo de 2 (indicando falha no escalonamento).
     - Erros HTTP 5xx detectados nos logs.

4. **Entrega do Teste**:
   - Criar um repositório no GitHub ou GitLab contendo:
     - Arquivos de configuração do CI/CD.
     - Manifests Kubernetes.
     - Configuração das ferramentas de monitoramento e observabilidade.
     - Um `README.md` explicando como configurar e rodar o pipeline e visualizar métricas e logs.
   - O candidato pode utilizar um cluster Kubernetes local (Minikube, Kind) ou um cluster gerenciado (EKS, GKE, AKS, OKE, etc.).

## Avaliação

O candidato será avaliado nos seguintes pontos:
- Estrutura e organização do repositório.
- Clareza e eficiência na configuração do CI/CD.
- Boas práticas no uso do Kubernetes.
- Implementação da observabilidade e capacidade de monitoramento.
- Capacidade de automação e escalabilidade da aplicação.
- Documentação clara e bem escrita.

Boa sorte! 🚀
