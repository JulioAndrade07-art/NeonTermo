import re
import sys
import argparse
from pathlib import Path

def filter_words(input_path, output_path):
    """
    Reads a file line by line, extracts unique words with exactly 5 letters,
    and writes them to an output file in the format "word",
    
    Args:
        input_path (str): Path to the input text file.
        output_path (str): Path to save the filtered words.
    """
    
    # Regex pattern to match words. 
    # \w matches Unicode word characters (letters, numbers, underscore).
    # We want to strictly match letters, so we use a character class.
    # [^\W\d_] means: not (non-word char, digit, or underscore).
    # Effectively matches only letters (including accented ones).
    word_pattern = re.compile(r'[^\W\d_]+')
    
    count = 0
    
    try:
        with open(input_path, 'r', encoding='utf-8') as infile, \
             open(output_path, 'w', encoding='utf-8') as outfile:
            
            # Process line by line for memory efficiency
            for line in infile:
                # Find all words in the line
                words = word_pattern.findall(line)
                
                for word in words:
                    # Check length requirement
                    if len(word) == 5:
                        # Write to output file in specific format
                        outfile.write(f'"{word.upper()}",\n')
                        count += 1
                        
        print(f"Sucesso! {count} palavras de 5 letras foram salvas em '{output_path}'.")
        
    except FileNotFoundError:
        print(f"Erro: O arquivo de entrada '{input_path}' não foi encontrado.")
    except Exception as e:
        print(f"Ocorreu um erro inesperado: {e}")

if __name__ == "__main__":
    # Set up argument parser for command line usage
    parser = argparse.ArgumentParser(description="Filtrar palavras de 5 letras de um arquivo de texto.")
    parser.add_argument("input_file", nargs='?', help="Caminho do arquivo de entrada (.txt)")
    parser.add_argument("output_file", nargs='?', default="palavras_filtradas.txt", help="Caminho do arquivo de saída (padrão: palavras_filtradas.txt)")

    args = parser.parse_args()

    # If no arguments provided, ask interactively or use defaults if run blindly
    if not args.input_file:
        print("--- Filtro de Palavras de 5 Letras ---")
        use_input = input("Digite o nome do arquivo de entrada: ").strip()
        if not use_input:
            print("Nenhum arquivo especificado. Encerrando.")
            sys.exit(1)
        input_path = use_input
        output_path = input("Nome do arquivo de saída (Enter para 'palavras_filtradas.txt'): ").strip() or "palavras_filtradas.txt"
    else:
        input_path = args.input_file
        output_path = args.output_file

    filter_words(input_path, output_path)
