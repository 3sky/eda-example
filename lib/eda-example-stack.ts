import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export class EdaExampleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    cdk.Tags.of(this).add("description", "EDA examples");
    cdk.Tags.of(this).add("organization", "3sky.dev");
    cdk.Tags.of(this).add("owner", "3sky");

    const myVPC = new ec2.Vpc(this, "MyVPC", {
      ipAddresses: ec2.IpAddresses.cidr("10.192.0.0/20"),
      maxAzs: 1,
      natGateways: 1,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          cidrMask: 28,
          name: "public",
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 26,
          name: "application",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    const generalSG = new ec2.SecurityGroup(this, "generalSG", {
      securityGroupName: "Allow traffic inside VPC",
      vpc: myVPC,
    });
    generalSG.addIngressRule(
      ec2.Peer.ipv4(myVPC.vpcCidrBlock),
      ec2.Port.tcp(22),
      "Allow inbound traffic inside VPC",
      false,
    );

    const runnerSG = new ec2.SecurityGroup(this, "bastion-SG", {
      securityGroupName: "Allow port 5000/tcp from bastion ",
      vpc: myVPC,
    });
    runnerSG.addIngressRule(
      ec2.Peer.ipv4("10.19.0.36/32"),
      ec2.Port.tcp(5000),
      "Allow 5000/tcp",
      false,
    );

    const bastionSG = new ec2.SecurityGroup(this, "bastion-SG", {
      securityGroupName: "Allow all SSH traffic",
      vpc: myVPC,
    });
    bastionSG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      "Allow SSH",
      false,
    );

    const myKeyPair = new ec2.CfnKeyPair(this, "localkeypair", {
      publicKeyMaterial:
        "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJxYZEBNRLXmuign6ZgNbmaSK7cnQAgFpx8cCscoqVed local",
      keyName: "localawesomekey",
    });

    const defaultInstanceProps = {
      vpc: myVPC,
      machineImage: ec2.MachineImage.genericLinux({
        // amazon/RHEL-9.3.0_HVM-20240117-x86_64-49-Hourly2-GP3
        "eu-central-1": "ami-0134dde2b68fe1b07",
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE2,
        ec2.InstanceSize.MICRO,
      ),
      keyPair: ec2.KeyPair.fromKeyPairAttributes(this, "mykey", {
        keyPairName: myKeyPair.keyName,
      }),
      allowAllOutbound: true,
      detailedMonitoring: true,
    };

    const machineList: string[] = ["bastion", "runner"];
    //const machineList: string[] = ["bastion", "runner", "compute"];

    const commandsUserData = ec2.UserData.forLinux();
    const userData = new ec2.MultipartUserData();

    userData.addUserDataPart(
      commandsUserData,
      ec2.MultipartBody.SHELL_SCRIPT,
      true,
    );

    userData.addCommands(
      `dnf --assumeyes install maven gcc java-17-openjdk python3-pip python3-devel`,
      `echo 'export JAVA_HOME=/usr/lib/jvm/jre-17-openjdk' >> /etc/profile`,
      `pip3 install wheel ansible ansible-rulebook ansible-runner`,
      `echo 'export PATH=$PATH:/usr/local/bin' >> /etc/profile`,
      `ansible-galaxy collection install ansible.eda`,
    );

    machineList.forEach((host) => {
      if (host == "runner") {
        const runner = new ec2.Instance(this, host, {
          instanceName: host,
          userData: userData,
          vpcSubnets: {
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          },
          privateIpAddress: "10.192.0.111",
          securityGroup: generalSG,
          ...defaultInstanceProps,
        });
        runner.addSecurityGroup(runnerSG);
        new cdk.CfnOutput(this, "runner-vm", {
          value: runner.instancePrivateIp,
          description: "Private IP address of runner node",
        });
      } else if (host == "bastion") {
        const bastion = new ec2.Instance(this, host, {
          instanceName: host,
          vpcSubnets: {
            subnetType: ec2.SubnetType.PUBLIC,
          },
          privateIpAddress: "10.192.0.36",
          securityGroup: bastionSG,
          ...defaultInstanceProps,
        });
        new cdk.CfnOutput(this, "bastion-vm", {
          value: bastion.instancePublicIp,
          description: "Public IP address of the bastion instance",
        });
      } else {
        const compute = new ec2.Instance(this, host, {
          instanceName: host,
          vpcSubnets: {
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          },
          privateIpAddress: "10.192.0.90",
          securityGroup: generalSG,
          ...defaultInstanceProps,
        });
        new cdk.CfnOutput(this, "compute-vm", {
          value: compute.instancePrivateIp,
          description: "Private IP addres of compute node",
        });
      }
    });
  }
}
