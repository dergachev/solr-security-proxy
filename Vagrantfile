# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|
  config.vm.box = "precise64"
  config.vm.box_url = "http://files.vagrantup.com/precise64.box"
  # config.vm.network :forwarded_port, guest: 8080, host: 8080
  # config.vm.network :private_network, ip: "192.168.33.10"
  # config.vm.network :public_network

  # provision some standard packages
  config.vm.provision :shell, :inline => <<-EOT
    apt-get -y install curl git vim
  EOT

  # install node, npm, and our packages
  config.vm.provision :shell, :inline => <<-EOT
    # ubuntu's nodejs package is old, and doesn't bundle npm
    apt-get -y install python-software-properties
    add-apt-repository ppa:chris-lea/node.js
    apt-get update
    apt-get -y install nodejs

    echo "Running 'cd /vagrant'"
    cd /vagran
    echo "Running 'npm install'"
    npm install
    echo "Running 'npm test'"
    npm tes
  EOT
end
