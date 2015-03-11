/*
 * Parsing of recipes written in german, in classic or tabular style.
 *
 *
 * Classic style
 * =============
 *
 *     400g Pelati
 *     Salz
 *     Olivenöl
 *     Basilikum
 *     1 Knoblauchzehe
 *
 * 1.  Knoblauch fein hacken, in Olivenöl andünsten, ohne dass dieser 
 *     viel Farbe annimmt.
 * 2.  Pelati dazugeben, 4h leicht köcheln lassen.
 * 3.  Mit Salz und evtl. Pfeffer abschmecken. Basilikum fein hacken,
 *     dazugeben, servieren.
 *
 *
 * Tabular style
 * =============
 *
 * Olivenöl             erhitzen
 * 1 Knoblauchzehe      fein hacken, kurz im Öl andünsten
 * 400g Pelati          dazugeben, 4h leicht köcheln lassen
 * Basilikum
 * Salz, Pfeffer        abschmecken, garnieren, servieren
 *
 */



(function(){
    var rezepte = function(converter) {

        // Inline: tags
        il_tags = function(text){
            return text.replace(/\n#(.*)/g, function(_, tags){
                var tags = tags.split(', ');
                var out = '';
                tags.forEach(function(tag){
                    tag = tag.replace(/\n/, '');
                    out += '<span class="tag">'+tag+'</span>\n';
                });
                return out;
            });
        }

        // Inline: Strikethrough
        il_del = function(text){
            return text.replace(/~T~T(.*?)~T~T/g, '<del>$1</del>');
        }

        // Inline: ingredient
        il_ingredient = function(text){
            // Every noun is treated as an ingredient, if not matched by the
            // following expression:
            var no_ingredient = /Zweig|Zehe|Stück|Bl[aä]tt|Hand|Prise|Essl|Bund|Stange|P[äa]ck|Fl[aä]sch|EL|TL|D[öo]s/;
            return text.replace(/[A-ZÄÖÜ][a-zäöü]+/g, function(noun){
                if (noun.match(no_ingredient)){
                    return noun;
                }
                return '<i>' + noun + '</i>';
            });
        }

        // Inline: Quantity
        il_quantity = function(text){
            return text.replace(/((\d\/)?\d+)/g, '<b>$1</b>');
        }

        // Block: Ingredient list
        var row = '\\n {4}([^\\n]+)';
        var block = '\\n(' + row + ')+(?=\\n)';
        row = new RegExp(row, 'g'); block = new RegExp(block, 'g');

        bk_ingredients = function(text) { 
            return text.replace(block, function(content){
                out = content.replace(row, '    <li>$1</li>\n')
                out = il_quantity(out);
                out = il_ingredient(out);
                return '\n<ul class="ingredients">' + out + '</ul>';
            });
        }

        // Block: Tabular recipe
        var table_row = '(.+\n)*?((\\S+ )+)  +(.*)';
        var table_block = '\\n\\n' + '(' + table_row + ')+' + '\\n\\n';

        table_row = new RegExp(table_row, 'g');
        table_block = new RegExp(table_block, 'g');

        bk_table = function(text) {
            return text.replace(table_block, function(content){
                content = content.replace(/^\n\n|\n\n$/g, '');
                var tblock = content.replace(table_row, function(row){
                    var instruction = row.match(/  (.*)/)[1];
                    instruction = instruction.replace(/^ */, '');
                    var ingredients = row.match(/(^|\n)(\S+ ?)+/g);
                    var trow = '<tr>\n    <td>';
                    ingredients.forEach(function(ingredient){
                        trow += '\n        ';
                        ingredient = ingredient.replace(/ $/, '');
                        ingredient = il_ingredient(ingredient);
                        ingredient = il_quantity(ingredient);
                        trow += ingredient + '<br />';
                    });
                    trow += '\n    </td>\n    <td>        ' + converter.makeHtml(instruction) + '</td></tr>';
                    return trow;
                });
                return '\n\n<table>\n' + tblock + '\n</table>';
            });
        }

        // Block: Comments
        
        var comment_row = '(^|\\n)(.+?) *~T *([^\\n]*)';
        comment_row = new RegExp(comment_row, 'g');

        il_comments = function(text) {
            return text.replace(comment_row, function(_, _, text, name){
                if (name){
                    return '\n<em>'+text+' –\xA0'+name+'</em>\n';
                } else {
                    return '\n<em>'+text+'</em>';
                }
            });
        }


        return [
        {
            type: 'lang',
            filter: il_del
        },
        {
            type: 'lang',
            filter: il_comments
        },
        {
            type: 'lang',
            filter: il_tags
        },
        {
            type: 'lang', 
            filter: bk_ingredients
        },
        { 
            type: 'lang', 
            filter: bk_table
        }
        ];
    };

// METEOR CHANGE: export this differently. 
    Showdown.extensions.rezepte = rezepte;
}());
