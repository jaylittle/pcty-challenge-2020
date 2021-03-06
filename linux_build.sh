#!/bin/bash
BASE=pcty
BRANCH=`git rev-parse --abbrev-ref HEAD`
COMMIT=`git log --pretty=format:'%h' -n 1`
TIMESTAMP=`date +%Y%m%d%H%M`
CONFIG=Release
PLATFORM=netcoreapp3.1
VERSION="${BASE}-${TIMESTAMP}-${BRANCH}-${COMMIT}-${CONFIG}"
FILENAME="pcty_current.tgz"
PUBDIR="PCTY.Web/bin/${CONFIG}/${PLATFORM}/publish"

echo Building version $VERSION
echo Publishing from $PUBDIR to $FILENAME

#Clean up leftovers from previous builds
if [ -d $PUBDIR ]
then
  rm -rf $PUBDIR
fi
if [ -f "$FILENAME" ]
then
  rm "$FILENAME"
fi

#Restore Nuget Packages
dotnet restore
if [ $? -ne 0 ]; then
  exit 1
fi

#Run Unit Tests (if applicable)
cd PCTY.Test
dotnet clean -c $CONFIG
dotnet test
if [ $? -ne 0 ]; then
  exit 1
fi

#Pull Down NPM packages
cd ../PCTY.Web
rm -rf node_modules
if [ -d wwwroot/dist ]
then
  rm -rf wwwroot/dist
  mkdir wwwroot/dist
fi
yarn install --force
if [ $? -ne 0 ]; then
  exit 1
fi

#Clean the build output
dotnet clean -c $CONFIG
if [ $? -ne 0 ]; then
  exit 1
fi

#Publish Release Build
NODE_ENV=production dotnet publish -c $CONFIG
if [ $? -ne 0 ]; then
  exit 1
fi

cd ..

#Create version.test file
echo $VERSION > "${PUBDIR}/version.txt"

tar -C $PUBDIR -czvf $FILENAME ./
