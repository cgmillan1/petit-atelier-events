import pathlib
src=pathlib.Path('src'); t=(src/'index.html').read_text()
js='\n'.join((src/f).read_text() for f in ['art.js','data.js','contract.js','app.js','admin.js','main.js'])
js='{\n'+js+'\n}'
out=pathlib.Path('dist'); out.mkdir(exist_ok=True)
(out/'index.html').write_text(t.replace('/*@@SCRIPTS@@*/',js))
import shutil
shutil.rmtree(out/'img',ignore_errors=True); shutil.copytree(src/'img',out/'img')
print(len((out/'index.html').read_text()))
