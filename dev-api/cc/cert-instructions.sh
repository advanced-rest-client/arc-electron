# Note, all certificates are valid for 10 years so I don't have to redo this every now and then

# Server self signed certificate for demo purposes
echo "Generating server certificate..."
openssl req -x509 -newkey rsa:4096 -keyout server_key.pem -out server_cert.pem -nodes -days 3650 -subj "/CN=localhost/O=Client\ Certificate\ Demo"

# Client certificates

# Pawel has a valid certificate
echo "Generating certificate for Pawel"
openssl req -newkey rsa:4096 -keyout pawel_key.pem -out pawel_csr.pem -nodes -days 3650 -subj "/CN=Pawel"

# Bob has self signed certificate
echo "Generating certificate for Bob"
openssl req -newkey rsa:4096 -keyout bob_key.pem -out bob_csr.pem -nodes -days 3650 -subj "/CN=Bob"

# Pawel's CSR is signed with server key
echo "Signing Pawel's certificate with server's key"
openssl x509 -req -in pawel_csr.pem -CA server_cert.pem -CAkey server_key.pem -out pawel_cert.pem -set_serial 01 -days 3650

# Bob signs his own certificate
echo "Signing Bob's certificate with Bob's key"
openssl x509 -req -in bob_csr.pem -signkey bob_key.pem -out bob_cert.pem -days 3650

# Create P12 format certificate that can be importend in a web browser or in ARC, obviously
echo "Creating Pawel's P12 certificate"
openssl pkcs12 -export -clcerts -in pawel_cert.pem -inkey pawel_key.pem -out pawel.p12
echo "Creating Bob's P12 certificate"
openssl pkcs12 -export -in bob_cert.pem -inkey bob_key.pem -out bob.p12
