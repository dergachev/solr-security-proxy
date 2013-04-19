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
    # alternatively, can do the following:
    #  apt-get -y install python-software-properties
    #  add-apt-repository ppa:chris-lea/node.js  
    #  apt-get update  
    #  apt-get -y install nodejs
    apt-get -y install nodejs
    curl https://npmjs.org/install.sh | clean=yes sh # must run as root, see http://git.io/YipIMQ
    
    cd /vagrant

    echo "Running 'npm install'"
    npm install
    echo "Running 'npm test'"
    npm test

    echo "You can run the following to start the node apps:"
    echo "  cd /vagrant/ && ./node_modules/.bin/nodemon -L solr-security-proxy.js"
    echo "  cd /vagrant/ && npm test"
    echo "On VM suspend, nodemon annoyingly goes into the background. Kill it as follows:"
    echo "  pkill -f nodemon"
  EOT
end
