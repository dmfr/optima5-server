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
		var hasBuildPick = true ;
		
		var activeTransferRecord = this.getActiveTransferRecord(),
			activeTransferStepRecord = this.getActiveTransferStepRecord() ;
		if( !activeTransferStepRecord ) {
			if( activeTransferRecord.get('spec_cde') ) {
				return true ;
			}
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
		if( activeTransferStepRecord.get('spec_cde_picking') ) {
			hasBuildPick = true ;
		}
		return hasBuildPick ;
	},
	hasInputNew: function() {
		var hasInput = false ;
		
		var activeTransferRecord = this.getActiveTransferRecord(),
			activeTransferStepRecord = this.getActiveTransferStepRecord() ;
		if( !activeTransferStepRecord ) {
			return false ;
		}
		
		if( activeTransferStepRecord.get('spec_input') ) {
			hasInput = true ;
		}
		return hasInput ;
	},
	
	optionsHasPrintLabels: function() {
		var activeTransferRecord = this.getActiveTransferRecord(),
			activeTransferStepRecord = this.getActiveTransferStepRecord() ;
		if( !activeTransferStepRecord ) {
			return false ;
		}
		if( activeTransferStepRecord.get('spec_input') ) {
			return true ;
		}
		return false ;
	},
	optionsHasPrintList: function() {
		var activeTransferRecord = this.getActiveTransferRecord(),
			activeTransferStepRecord = this.getActiveTransferStepRecord() ;
		if( !activeTransferStepRecord ) {
			return false ;
		}
		if( activeTransferStepRecord.get('spec_input') ) {
			return false ;
		}
		return true ;
	},
	optionsHasAdrAlloc: function() {
		var activeTransferRecord = this.getActiveTransferRecord(),
			activeTransferStepRecord = this.getActiveTransferStepRecord() ;
		if( !activeTransferStepRecord ) {
			return false ;
		}
		if( activeTransferRecord.get('spec_cde') ) {
			return false ;
		}
		if( activeTransferStepRecord.get('spec_input') ) {
			return false ;
		}
		return true ;
	},
	optionsHasCdeAlloc: function() {
		var activeTransferRecord = this.getActiveTransferRecord(),
			activeTransferStepRecord = this.getActiveTransferStepRecord() ;
		if( !activeTransferStepRecord ) {
			return false ;
		}
		if( activeTransferRecord.get('spec_cde') && activeTransferStepRecord.get('spec_cde_picking') ) {
			return true ;
		}
		return false ;
	},
	optionsHasFastCommit: function() {
		var activeTransferRecord = this.getActiveTransferRecord(),
			activeTransferStepRecord = this.getActiveTransferStepRecord() ;
		if( !activeTransferStepRecord || activeTransferStepRecord.get('spec_input') ) {
			return false ;
		}
		return true ;
	},
	optionsHasFastOut: function() {
		var activeTransferRecord = this.getActiveTransferRecord(),
			activeTransferStepRecord = this.getActiveTransferStepRecord() ;
		if( !activeTransferStepRecord || !activeTransferStepRecord.get('spec_nocde_out') ) {
			return false ;
		}
		return true ;
	},
	optionsHasCdeDocs: function() {
		var activeTransferRecord = this.getActiveTransferRecord() ;
		if( activeTransferRecord.get('spec_cde') ) {
			return true ;
		}
		return false ;
	},
	optionsHasShipping: function() {
		var activeTransferRecord = this.getActiveTransferRecord(),
			activeTransferStepRecord = this.getActiveTransferStepRecord() ;
		if( !activeTransferStepRecord ) {
			return false ;
		}
		if( activeTransferStepRecord.get('spec_cde_packing') ) {
			return true ;
		}
		return false ;
	},
	
	dummyFn: function() {
		
	}
}) ;
