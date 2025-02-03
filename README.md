# Node.js Hello World API

Esse repositório visa conter os arquivos necessários para deployar uma aplicação utilizando GitHub Actions em um cluster local (Minikube), assim como monitorá-la através do Prometheus e Grafana.

## Requisitos

- Instalar e executar o Docker ([Documentação de apoio](https://docs.docker.com/engine/install/))

- Instalar o Minikube ([Documentação de apoio](https://minikube.sigs.k8s.io/docs/start/?arch=%2Fmacos%2Fx86-64%2Fstable%2Fbinary+download))

- Instalar o Kubectl ([Documentação de apoio](https://kubernetes.io/docs/tasks/tools/))

- Instalar o ngrok ([Documentação de apoio](https://download.ngrok.com/downloads))

## Preparando o ambiente

1. Iniciar o minikube:
```sh
minikube start
```

2. Habilitar o addon de métricas do Kubernetes
```sh
minikube addons enable metrics-server
```

3. Criar uma ServiceAccount no Kubernetes que será usada para autenticar no cluster e realizar o Deploy
```sh
kubectl create serviceaccount ci-deployer -n default
```

4. Criar role para a ServiceAccount com as permissões necessárias

   4.1 Criar o arquivo **serviceaccount.yml** com o seguinte conteúdo:
   ```yml
   apiVersion: rbac.authorization.k8s.io/v1
   kind: Role
   metadata:
      namespace: default
      name: deployment-manager
   rules:
   - apiGroups: ["apps"]
      resources: ["deployments", "horizontalpodautoscalers"]
      verbs: ["get", "list", "create", "update", "delete", "patch"]
   - apiGroups: [""]
      resources: ["services", "configmaps"]
      verbs: ["get", "list", "create", "update", "delete", "patch"]
   ```
   4.2 Aplicar o arquivo no Kubernetes
   ```sh
   kubectl apply -f serviceaccount.yml
   ```

5. Atrelar a role a ServiceAccount criadas
```sh
kubectl create rolebinding deployer-binding --role=deployment-manager --serviceaccount=default:ci-deployer --namespace=default
```

6. Criar um token para a ServiceAccount
```sh
kubectl create token ci-deployer -n default
```

7. Salvar o token na variável **KUBERNETES_TOKEN** do environment **Production** deste repositório ([settings -> Environments -> Production](https://github.com/hockpond/api-node-clone/settings/environments/5401300279/edit)). Isso é necessário para que o workflow do GitHub Actions consiga recuperar o valor do token e realizar o deploy da aplicação. As demais variáveis não precisam ser alteradas por hora.

8. Criar um túnel de conexão entre sua máquina local e o cluster Kubernetes (isso é necessário para poder expor os serviços e acessálos pelo IP de sua máquina local)

```sh
sudo minikube tunnel
```

9. Habilitar um proxy que exponha o cluster na porta **8080** para a internet (necessário para que o workflow do GitHut Actions consiga fazer requisições de deploy para o cluster)
```sh
kubectl proxy --address='0.0.0.0' --accept-hosts='^*$' --port=8080
``` 

10. Configure o ngrok da seguinte forma (o token a seguir foi criado especificamente para esse teste).
```sh
ngrok authtoken 2sQD8N7D1tOyRL4D24tBonlhy8T_5URgkABUrGxuHhMZLJFPQ
```

11. Exponha a porta **8080** (a qual se refere a porta que o cluster Kubernetes foi exposto localmente anteriormente) para a internet usando o ngrok
```sh
ngrok http 8080
```

12. Copie a URL pública exibida no campo **Forwarding** e salve na variável **KUBERNETES_URL** do environment **Production** deste repositório ([settings -> Environments -> Production](https://github.com/hockpond/api-node-clone/settings/environments/5401300279/edit)). Essa URL será usada para disparar o deploy através do GitHub Actions