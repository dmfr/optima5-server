Ext.define('Optima5.Modules.Spec.DbsLam.TransferInnerMixin',{
	_activeTransferRecord: null,
	_actionTransferStepIdx: null,
	
	initInner: function() {
		
	},
	getActiveTransferRecord: function() {
		return this._activeTransferRecord ;
	},
	getActiveTransferStepRecord: function() {
		var ret = null ;
		this._activeTransferRecord.steps().each( function(transferStepRecord) {
			if( transferStepRecord.get('transferstep_idx')==this._actionTransferStepIdx ) {
				ret = transferStepRecord ;
			}
		},this) ;
		return ret ;
	},
	getInnerTitle: function() {
		var transferStepRecord = this.getActiveTransferStepRecord() ;
		if( transferStepRecord ) {
			return transferStepRecord.get('transferstep_txt') ;
		}
	},
	refreshData: function() {
		console.log('default refresh') ;
	},
	
	handleBuildPick: function() {
		console.log('default buildpick') ;
	},
	handleInputNew: function() {
		console.log('default inputnew') ;
	},
	
	hasBuildPick: function() {
		var hasBuildPick = true,
			hasInput = false ;
		
		var activeTransferRecord = this.getActiveTransferRecord(),
			activeTransferStepRecord = this.getActiveTransferStepRecord() ;
		if( !activeTransferStepRecord ) {
			return false ;
		}
		
		activeTransferRecord.steps().each( function( transferStepRecord ) {
			if( transferStepRecord.get('forward_is_on')
				&& (transferStepRecord.get('forward_to_idx')==activeTransferStepRecord.get('transferstep_idx')) ) {
				hasBuildPick = false ;
			}
		}) ;
		Ext.Array.each(['spec_input','spec_cde_packing'],function(spec) {
			if( activeTransferStepRecord.get(spec) ) {
				hasBuildPick = false ;
			}
		});
		return hasBuildPick ;
	},
	hasInputNew: function() {
		var hasBuildPick = true,
			hasInput = false ;
		
		var activeTransferRecord = this.getActiveTransferRecord(),
			activeTransferStepRecord = this.getActiveTransferStepRecord() ;
		if( !activeTransferStepRecord ) {
			return false ;
		}
		
		if( activeTransferStepRecord.get('spec_input') ) {
			hasInput = true ;
		}
		return hasInput ;
	}
}) ;
