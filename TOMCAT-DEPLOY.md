## Installation:

```bash
sudo su - # run the following as root

apt-get install solr-tomcat # installs solr 1.4, perfect for reuters dataset; bad otherwise

cd /var/lib/solr
rm -Rf data/
wget https://github.com/downloads/evolvingweb/ajax-solr/reuters_data.tar.gz
tar xzvf reuters_data.tar.gz
chown -R tomcat6:tomcat6 data

cd /etc/solr/conf/
rm schema.xml
wget https://gist.github.com/dergachev/5498896/raw/b1d95be98939a17f75a45eddecf349da876a7e4e/schema.xml
chown tomcat6:tomcat6 schema.xml

service tomcat6 restart

# ensure that the last line succeeds, or fail the provision
curl http://localhost:8080/solr/select?q=id:3 | grep -C 10 TEXAS
```


Some useful diagnostics:

```bash
curl http://localhost:8081/solr/admin/registry.jsp | grep solr-implementation-version  # 	Solr Specification Version: 1.4.1.2011.09.12.09.25.21
curl http://localhost:8080/solr/update?stream.body=%3Ccommit/%3E
curl http://localhost:8080/solr/update?comit=true -H "Content-Type: text/xml" --data-binary '<add><doc><field name="id">3</field></doc></add>'
curl http://localhost:8080/solr/select?q=id:3
```

Relevant config files:

```
/var/log/tomcat6/catalina.out             # tomcat log
/etc/tomcat6/Catalina/localhost/solr.xml  # symlink to -> /etc/solr/solr-tomcat.xml
/etcsolr/solr-tomcat.xml                  # tomcat Context definition; references to /usr/share/solr as docBase and solr/home
/usr/share/solr/                          # webroot, contains symlink ./conf -> /etc/solr
/etc/solr/solrconfig.xml                  # dataDir -> /var/lib/solr/data
/etc/solr/schema.xml
/var/lib/solr/data
```

Resources:

* https://github.com/sunspot/sunspot/wiki/Configure-Solr-on-Ubuntu,-the-quickest-way
* http://web.archive.org/web/20130302185330/http://wiki.apache.org/solr/SolrTomcat
* https://gist.github.com/dergachev/5498896#schema.xml
* https://github.com/evolvingweb/ajax-solr/wiki/reuters-tutorial
* http://contextllc.com/node/76

## vagrant_chef_inline

Get the prerequsite (prerelease necessary to avoid bugs):

```
vagrant plugin install --plugin-prerelease sourcify --plugin-source http://rubygems.org 
```

Now add this to the Vagrantfile:

```ruby
  create_inline_cookbook "tomcat-solr-reuters" do
    package "solr-tomcat"
    directory "/var/lib/solr" do
      action :create
      recursive true
    end

    remote_file "/var/lib/solr/reuters_data.tar.gz" do
      source "https://github.com/downloads/evolvingweb/ajax-solr/reuters_data.tar.gz"
      action :create_if_missing
      notifies :run, "bash[Unpack reuters solr index]", :immediately
    end

    bash "Unpack reuters solr index" do
      cwd "/var/lib/solr"
      code <<-EOT
        rm -Rf /var/lib/solr/data
        tar xzvf reuters_data.tar.gz
        chown -R tomcat6:tomcat6 data
      EOT
      action :nothing
    end

    remote_file "/etc/solr/schema.xml" do
      source "https://gist.github.com/dergachev/5498896/raw/b1d95be98939a17f75a45eddecf349da876a7e4e/schema.xml"
      action :create_if_missing
      user "tomcat6"
      group "tomcat6"
      mode "0644"
      notifies :restart, "service[tomcat6]", :immediately
    end

    service "tomcat6" do
      action :nothing
    end

    bash "Ensure solr is up and serving reuters" do
      code "curl http://localhost:8080/solr/select?q=id:3 | grep -C 10 TEXAS"
    end
  end

  config.vm.provision :chef_solo do |chef|
    chef.add_recipe "chef_inline_solr-tomcat-reuters"
  end
```

And this is chef_inline.rb code:

```ruby
require 'sourcify'
require 'rubygems'

def create_inline_cookbook(name,&content)
  # just so we dont delete anything foolishly
  raise "invalid cookbook name" if name.match(/[^a-zA-Z0-9_-]/)
  cookbook_path = "./cookbooks/chef_inline_#{name}"
  `mkdir -p #{cookbook_path}/recipes`
  File.open("#{cookbook_path}/recipes/default.rb", "w") do |f|
     f.write(content.to_raw_source(:strip_enclosure => true))
  end
end
```

Relevant resources:

* https://github.com/ngty/sourcify/issues/26
* https://github.com/ngty/sourcify
* http://stackoverflow.com/a/5775055
* http://wiki.opscode.com/display/chef/Cookbook+Fast+Start+Guide#CookbookFastStartGuide-CreateanewCookbookcalled"fast_start"
* https://github.com/RiotGames/berkshelf/blob/master/lib/berkshelf/cookbook_generator.rb
* https://github.com/maxkazar/generator
* http://stackoverflow.com/questions/4407548/chef-cookbook-for-solr
* https://github.com/wulff/vagrant-solr/blob/master/Vagrantfile
