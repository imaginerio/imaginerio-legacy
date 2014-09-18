var sys = require( 'sys' ),
	exec = require( 'child_process' ).exec,
	fs = require( 'fs' ),
	AWS = require( 'aws-sdk' ),
	child,
	date = Date.parse( new Date() );

//loading AWS config
AWS.config.loadFromPath( __dirname + '/mapnik/aws-config.json' );
var s3 = new AWS.S3();

child = exec( "pg_dump -C rio | gzip > " + date + ".gz", function ( error, stdout, stderr )
{
	if( error !== null )
	{
		console.log( 'exec error: ' + error );
	}
	else
	{
		s3_upload( date + ".gz" );
	}
});

function s3_upload( fileName )
{
	// File
	var filePath = './' + fileName,
		fileKey = 'backup/' + fileName,
		buffer = fs.readFileSync( './' + filePath );

	// S3 Upload options
	var bucket = 'imagine-rio';
 
	// Upload
	var startTime = new Date(),
		partNum = 0,
		partSize = 1024 * 1024 * 5,
		numPartsLeft = Math.ceil( buffer.length / partSize ),
		maxUploadTries = 3,
		multiPartParams = {
			Bucket : bucket,
			Key : fileKey,
			ContentType : 'application/pdf'
		},
		multipartMap = {
			Parts: []
		};
 
	function completeMultipartUpload( s3, doneParams )
	{
		s3.completeMultipartUpload( doneParams, function( err, data )
		{
			if( err )
			{
				console.log( "An error occurred while completing the multipart upload" );
				console.log( err );
			}
			else
			{
				var delta = ( new Date() - startTime ) / 1000;
				console.log( 'Completed upload in', delta, 'seconds' );
				console.log( 'Final upload data:', data );
			}
		});
	}
 
	function uploadPart( s3, multipart, partParams, tryNum )
	{
		var tryNum = tryNum || 1;
		s3.uploadPart( partParams, function( multiErr, mData )
		{
			if( multiErr )
			{
				console.log( 'multiErr, upload part error:', multiErr );
				if( tryNum < maxUploadTries )
				{
					console.log( 'Retrying upload of part: #', partParams.PartNumber );
					uploadPart( s3, multipart, partParams, tryNum + 1 );
				}
				else
				{
					console.log( 'Failed uploading part: #', partParams.PartNumber );
					}
				return;
			}
			
			multipartMap.Parts[ this.request.params.PartNumber - 1 ] = {
				ETag : mData.ETag,
				PartNumber : Number( this.request.params.PartNumber )
			};
			console.log( "Completed part", this.request.params.PartNumber );
			console.log( 'mData', mData );
			
			if( --numPartsLeft > 0 ) return; // complete only when all parts uploaded
 
			var doneParams = {
				Bucket : bucket,
				Key : fileKey,
				MultipartUpload : multipartMap,
				UploadId : multipart.UploadId
    		};
 
			console.log( "Completing upload..." );
			completeMultipartUpload( s3, doneParams );
			fs.unlink( filePath, function( err )
			{
				if( err )
				{
					console.log( err )
				}
				else
				{
					console.log( "File deleted!" );
				}
			});
		});
	}
 
	// Multipart
	console.log( "Creating multipart upload for:", fileKey );
	s3.createMultipartUpload( multiPartParams, function( mpErr, multipart )
	{
		if( mpErr )
		{
			console.log( 'Error!', mpErr );
			return;
		}
		console.log( "Got upload ID", multipart.UploadId );
 
		// Grab each partSize chunk and upload it as a part
		for( var rangeStart = 0; rangeStart < buffer.length; rangeStart += partSize )
		{
			partNum++;
			var end = Math.min( rangeStart + partSize, buffer.length ),
				partParams = {
					Body : buffer.slice( rangeStart, end ),
					Bucket : bucket,
					Key : fileKey,
					PartNumber : String( partNum ),
					UploadId : multipart.UploadId
        		};
 
			// Send a single part
			console.log( 'Uploading part: #', partParams.PartNumber, ', Range start:', rangeStart );
			uploadPart( s3, multipart, partParams );
		}
	});
}