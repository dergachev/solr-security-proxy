## daemontools 

The following installs daemontools, and creates a service for
solr-security-proxy with specified params:

```
# install daemontools
sudo apt-get install -y daemontools daemontools-run

# configure our service
sudo mkdir -p /etc/service/solr-security-proxy
sudo tee /etc/service/solr-security-proxy/run <<EOT
#! /bin/bash
exec node /vagrant/solr-security-proxy.js --port 8008 --backend.port 8080 --backend.host 127.0.0.1 --validPaths /reuters/select
EOT
sudo chmod u+rwx /etc/service/solr-security-proxy/run
```

Now it should run automatically. 

NOTE: in precise64.box, there seems to be a bug where /usr/bin/svscanboot is
not run until after a reboot. Perhaps it can be run manually somehow.  
See /etc/init/svscan.conf and /var/lib/dpkg/info/daemontools-run.postinst

To kill svscan this does not work (something brings it right back):

```bash
pstree -a
ps aux | egrep 'svscan|readproctitle|node|supervise'
pkill 'svscan|readproctitle service|supervise|node'
cd /etc/service/solr-security-proxy 
sudo svc -dx .
sudo svstatus .  # run this a couple of times, watch it come back
```

Instead, edit /etc/service/solr-security-proxy/run and comment out the "exec" line:

```bash
sudo vim /etc/service/solr-security-proxy
sudo svc -dx /etc/service/solr-security-proxy
ps aux | egrep 'svscan|readproctitle|node|supervise' # looks good
```
