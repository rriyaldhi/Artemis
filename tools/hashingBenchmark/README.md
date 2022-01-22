# Hasing Benchmark

This tool is a very small helper tool to determine the best round count for bycript password hashing.

## Compile Tool

Enter CLI in the Artemis root. Run `./gradlew tools:hashingBenchmark:clean tools:hashingBenchmark:jar` to build the executable jar file. You can find it in `Artemis/tools/hashingBenchmark/build/libs/`.

## Parameters

You can pass one string that will be used for the log file name and the title of the benchmark. Otherwise a default name will be used.

## Execution

Run the tool with `java -jar <path-to-jar>/HashingBenchmark-<version>.jar`. After some seconds, a text file will be generated in the same directory as the tool.

The log file contains all measurements taken. At the end the tool recommends a round setting for your hardware configuration.
