// EXPRESS ----------------------------------------------------------------------------------------------- //
const express = require('express');
const app = express();
// se define que se enviara y recivira informacion tipo json
app.use(express.json());
// En algun momento me mando problema de acceso desde la pag pero no desde postman, esto lo soluciona.
app.use((req, res, next) =>
{
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
// MONGOOSE ---------------------------------------------------------------------------------------------- //
const mongoose = require('mongoose');

// schema
const GeneroSchema = new mongoose.Schema
    ({
        nombre: String,
        deleted: Boolean
    });
// model
const GeneroModel = mongoose.model("generos", GeneroSchema);

// schema
const LibroSchema = new mongoose.Schema
    ({
        nombre: String,
        autor: String,
        genero:
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'generos'
        },
        prestado: String
    });
// model
const LibroModel = mongoose.model("libros", LibroSchema);

const URI = "mongodb+srv://admin:admin@cluster0.r4cnv.mongodb.net/library?retryWrites=true&w=majority";

// OTHERS ------------------------------------------------------------------------------------------------ //
const PORT = 3000;

const STATUS_OK = 200;
const BAD_REQUEST = 400;
const STATUS_ERROR = 422;

// PRESTAR ----------------------------------------------------------------------------------------------- //
app.post('/prestar', (request, response) =>
{
    try
    {
        let id = request.body.id;
        let prestado = request.body.prestado;

        if (checkEmptyValue(id))
        {
            response.status(BAD_REQUEST).send({ message: 'Falto cargar el id' });
            return;
        }
        if (checkEmptyValue(prestado))
        {
            response.status(BAD_REQUEST).send({ message: 'Falto cargar el prestado' });
            return;
        }

        LibroModel.findById(id, (err, result) =>
        {
            if (err) throw new Error(err)
            if (result)
            {
                // Se verifica que el libro que se intenta prestar este disponible.
                if (result.prestado != '' && result != undefined)
                {
                    response.status(BAD_REQUEST).send({ message: 'No puede prestar un libro que ya esta prestado' });
                }
                else
                {
                    // se realiza la actualizacion
                    let update =
                    {
                        prestado: prestado
                    }
                    LibroModel.findByIdAndUpdate(id, update);
                    response.status(STATUS_OK).send({ message: 'Se presto el libro con exito' });
                }
            }
        });
    }
    catch (error)
    {
        response.status(STATUS_ERROR).send({ message: error });
    }
});
// LIBROS ------------------------------------------------------------------------------------------------ //
app.post('/libro', (request, response) =>
{
    try
    {
        let nombre = request.body.nombre;
        let autor = request.body.autor;
        let genero = request.body.genero;
        // el prestado siempre ira vacio
        // se esta cargando un libro, no prestandolo.
        let prestado = '';

        if (checkEmptyValue(nombre))
        {
            response.status(BAD_REQUEST).send({ message: 'Falto cargar el nombre' });
            return;
        }
        if (checkEmptyValue(autor))
        {
            response.status(BAD_REQUEST).send({ message: 'Falto cargar la autor' });
            return;
        }
        if (checkEmptyValue(genero))
        {
            response.status(BAD_REQUEST).send({ message: 'Falto cargar el genero' });
            return;
        }

        // El genero que se recive sera el id asique nos aseguramos de que exista en nuestro listado.-
        GeneroModel.findById(genero, (err, result) =>
        {
            if (err) throw new Error(err)
            if (result)
            {
                let libro =
                {
                    nombre: nombre,
                    autor: autor,
                    genero: genero,
                    prestado: prestado,
                }
                // se guarda el libro.-
                LibroModel.create(libro, (errCreate, resultCreate) =>
                {
                    if (errCreate) throw new Error(errCreate)
                    if (resultCreate)
                    {
                        response.status(STATUS_OK).send({ message: 'Se guardo correctamente el libro.' });
                    }
                });
            }
            else
            {
                response.status(BAD_REQUEST).send({ message: 'No se encontro ningun genero para:' + genero });
            }
        });
    }
    catch (error)
    {
        response.status(STATUS_ERROR).send({ message: error });
    }
});
app.get('/libro/:id', (request, response) =>
{
    try
    {
        let id = request.params.id;

        if (checkEmptyValue(id))
        {
            response.status(BAD_REQUEST).send({ message: 'Falto cargar el id' });
            return;
        }

        LibroModel.findById(id, (err, result) =>
        {
            if (err) throw new Error(err)
            if (result)
            {
                response.status(STATUS_OK).send(result);
            }
            else
            {
                response.status(BAD_REQUEST).send({ message: 'No se encontro libro con el id:' + id });
            }
        });
    }
    catch (error)
    {
        response.status(STATUS_ERROR).send({ message: error });
    }
});
app.get('/libro', (request, response) =>
{
    try
    {
        LibroModel.find((err, result) =>
        {
            if (err) throw new Error(err)
            if (result)
            {
                response.status(STATUS_OK).send(result);
            }
            else
            {
                response.status(BAD_REQUEST).send({ message: 'No se encontraron valores' });
            }
        });
    }
    catch (error)
    {
        response.status(STATUS_ERROR).send({ message: error });
    }
});
// GENEROS ----------------------------------------------------------------------------------------------- //
app.post('/genero', (request, response) =>
{
    try
    {
        let nombre = request.body.nombre;

        if (checkEmptyValue(nombre))
        {
            response.status(BAD_REQUEST).send({ message: 'Falto cargar el nombre' });
            return;
        }

        // siempre se almacenera el nombre del genero en minuscula.-
        nombre = nombre.toLowerCase();

        let params =
        {
            nombre: nombre
        };
        // Se verifica que el genero no este ya cargado.-
        GeneroModel.findOne(params, (err, result) =>
        {
            if (err) throw new Error(err)
            if (result)
            {
                response.status(BAD_REQUEST).send({ message: 'Este genero ya esta cargado' });
            }
            else
            {
                let genero =
                {
                    nombre: nombre,
                    deleted: false
                };

                // Se crea el genero.-
                GeneroModel.create(genero, (errCreate, resultCreate) =>
                {
                    if (errCreate) throw new Error(errCreate)
                    if (resultCreate)
                    {
                        response.status(STATUS_OK).send({ message: 'Se cargo el genero' });
                    }
                });
            }
        });
    }
    catch (error)
    {
        response.status(STATUS_ERROR).send({ message: error });
    }
})
app.get('/genero/:id', (request, response) =>
{
    try
    {
        let id = request.params.id;

        if (checkEmptyValue(id))
        {
            response.status(BAD_REQUEST).send({ message: 'Falto cargar el id' });
            return;
        }

        let params =
        {
            _id: id,
            deleted: false
        }
        // se busca un resultado que cumpla los requisitos de 'params'
        GeneroModel.findOne(params, (err, result) =>
        {
            if (err) throw new Error(err)
            if (result)
            {
                response.status(STATUS_OK).send(result);
            }
            else
            {
                response.status(BAD_REQUEST).send({ message: 'no se encontro valores' });
            }
        });
    }
    catch (error)
    {
        response.status(STATUS_ERROR).send({ message: error });
    }
});
app.get('/genero', (request, response) =>
{
    try
    {
        let params =
        {
            deleted: false
        }
        // Se buscan todos generos que cumplan el requisito 'params'
        GeneroModel.find(params, (err, result) =>
        {
            if (err) throw new Error(err)
            if (result)
            {
                response.status(STATUS_OK).send(result);
            }
            else
            {
                response.status(BAD_REQUEST).send({ message: 'No se encontro valores' });
            }
        });
    }
    catch (error)
    {
        response.status(STATUS_ERROR).send({ message: error });
    }
});
app.delete('/genero/:id', (request, response) =>
{
    try
    {
        let id = request.params.id;

        if (checkEmptyValue(id))
        {
            response.status(BAD_REQUEST).send({ message: 'Falto cargar el id' });
            return;
        }

        // Se busca un genero por id y que no este ya borrado para
        // verificar que exista.-
        GeneroModel.findById(id, (err, result) =>
        {
            if (err) throw new Error(err)
            if (result)
            {
                if (result.deleted)
                {
                    response.status(BAD_REQUEST).send({ message: 'Este genero ya habia sido borrado' });
                    return;
                }

                // se modifica el valor de 'deleted'.-
                result.deleted = true;
                // se busca por id y se insertan los mismos valores a excepcion del 'deleted' que le cambiamos el valor.-
                GeneroModel.findByIdAndUpdate(id, result, (errUpdate, resUpdate) =>
                {
                    if (errUpdate) throw new Error(errUpdate)
                    if (resUpdate)
                    {
                        response.status(STATUS_OK).send({ message: 'OK' });
                    }
                    else
                    {
                        response.status(BAD_REQUEST).send({ message: 'No se actualizo la tabla' });
                    }
                });
            }
            else
            {
                response.status(BAD_REQUEST).send({ message: 'No se encontro genero para el id:' + id });
            }
        });
    }
    catch (error)
    {
        response.status(STATUS_ERROR).send({ message: error });
    }
});
app.put('/genero', (request, response) =>
{
    try
    {
        let nombre = request.body.nombre;
        let id = request.body.id;

        if (checkEmptyValue(nuevoNombre))
        {
            response.status(BAD_REQUEST).send({ message: 'Falto cargar el newNombre' });
            return;
        }
        if (checkEmptyValue(id))
        {
            response.status(BAD_REQUEST).send({ message: 'Falto cargar el id' });
            return;
        }

        // me aseguro que el nombre este en minuscula.-
        nombre = nombre.toLowerCase();
        // se verifica que el nuevo nombre no este ya en uso.-
        GeneroModel.findOne({ nombre: nombre }, (err, result) =>
        {
            if (err) throw new Error(err)
            if (result)
            {
                response.status(BAD_REQUEST).send({ message: 'Ya existe un genero con el nombre:' + nombre });
            }
            else
            {
                // se verifica que exista un genero con el id buscado.-
                GeneroModel.findOne({ _id: id }, (errFind, resultFind) =>
                {
                    if (errFind) throw new Error(errFind)
                    if (resultFind)
                    {
                        // se verifica si algun libro ya tiene este id de genero asignado.-
                        LibroModel.findOne({ genero: id }, (errLibro, resultLibro) =>
                        {
                            if (errLibro) throw new Error(errLibro)
                            if (resultLibro)
                            {
                                response.status(BAD_REQUEST).send({ message: 'Ya existen libros asignados con este genero, contacte al administrador!' });
                            }
                            else
                            {
                                // finalmente se ejecuta la actualizacion del genero en la base de datos.-
                                GeneroModel.findByIdAndUpdate(id, { nombre: nombre }, (errUpdate, resultUpdate) =>
                                {
                                    if (errUpdate) throw new Error(errUpdate)
                                    if (resultUpdate)
                                    {
                                        response.status(STATUS_OK).send({ message: 'Se actualizo la base de datos correctamente.' });
                                    }
                                })
                            }
                        });
                    }
                    else
                    {
                        response.status(BAD_REQUEST).send({ message: 'El genero que intenta modificar no existe.' });
                    }
                });
            }
        });
    }
    catch (error)
    {
        response.status(STATUS_ERROR).send({ message: error });
    }
});
// UTILS ------------------------------------------------------------------------------------------------- //
/**
 * Chequea si un valor es 'undefined' o 'empty'.-
 * @param {*} value 
 * @returns true or false
 */
function checkEmptyValue(value)
{
    if (value == undefined || value == '')
    {
        return true;
    }
    return false;
}
// ------------------------------------------------------------------------------------------------------- //
// Conectar al servidor mongodb.-
async function conectar()
{
    try
    {
        await mongoose.connect(URI,
            {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                useFindAndModify: false // configs (evitar mensaje deprecated)
            })
        console.log("Conectado a la base de datos metodo: mongoodb - async-await");
    }
    catch (e)
    {
        console.log(e);
    }
};
conectar();
// Se inicia el servidor.-
app.listen(PORT, () => console.log('Server start in port ' + PORT));