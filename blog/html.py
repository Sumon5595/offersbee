address = input()

filename = "".join(str(address)+".html")

data = """<head><meta http-equiv="refresh" content="1;url=https://bdjob24.org/?blog="""
data1 = address
data2 = """/><meta name="robots" content="noindex"><meta name="googlebot" content="noindex"></head><body><p style="color:red; font-size:40px;">Malubd.Org - Download Link Loading...</p></body>"""
final = data+data1+data2

f= open(filename,"a")
f.write(f'{final}\n')
print(filename)

