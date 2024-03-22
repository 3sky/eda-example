# EDA examples on AWS

Simple examples of usage EDA inside AWS.
Repository is a part of bigger project, described on the
[blog](https://blog.3sky.dev/article/202403-eda-introduction/).

## Prerequirement

### AWS Account

As playground is based on AWS you need to have
needed priviliges and credentionals in general.

``` shell
export AWS_ACCESS_KEY_ID="ASIA...."
export AWS_SECRET_ACCESS_KEY="vX0cN..."
export AWS_SESSION_TOKEN="iamm..."
```

**Setting up correct roles isn't part of the articule.**

### SSH key pair

SSH key pair are needed for this playground. To get new one
please run the command.

``` shell
ssh-keygen -t ed25519 -C "local" -f ~/.ssh/id_ed25519_eda
```

If you already have key pairs or you just generated them, 
in both cases additional work is needed.

1. Change key pair path in `~/.ssh/config`.
1. Past **public** key content into `/lib/eda-example-stack.ts`.

``` typescript
    const myKeyPair = new ec2.CfnKeyPair(this, "localkeypair", {
      publicKeyMaterial:
        "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJxYZEBNRLXmuign6ZgNbmaSK7cnQAgFpx8cCscoqVed local",
      keyName: "localawesomekey",
    });
```

## How to use

1. Init a project, and wait for the output.

```shell
make deploy
```

1. If you missing public IP of Bastion host, use:

``` shell
make print
```

1. Configure your ssh client by adding to `~/.ssh/config`
below lines. Remember about adding public IP address of Bastion host.

``` shell
Host jump
  PreferredAuthentications publickey
  IdentitiesOnly=yes
  IdentityFile ~/.ssh/id_ed25519_eda
  User ec2-user
  # this one could change
  # as its public IP
  Hostname 3.126.251.7

Host runner
  PreferredAuthentications publickey
  IdentitiesOnly=yes
  ProxyJump jump
  IdentityFile ~/.ssh/id_ed25519_eda
  User ec2-user
  Hostname 10.192.0.111

Host compute
  PreferredAuthentications publickey
  IdentitiesOnly=yes
  ProxyJump jump
  IdentityFile ~/.ssh/id_ed25519_eda
  User ec2-user
  Hostname 10.192.0.90
```

1. Now you have access to 3 compute nodes.

- bastion is jump station
- runner is a node, that contains ansible, ansible runners, and all deps
- compute is empty RHEL box

**Please be aware, that conenction from runner to compute
requires setting ssh key pairs between them. Where login with user/password is disabled**

That is why the easiest way will be adding key content to `~/.ssh/authorized_keys` manually.

## Useful commands (for working with CDK)

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template
